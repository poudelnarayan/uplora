export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { S3Client, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, GetObjectCommand, PutObjectCommand, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";
import { tmpdir } from "os";
import { join } from "path";
import { createWriteStream, createReadStream, unlinkSync } from "fs";
import { spawn } from "child_process";
import crypto from "crypto";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, uploadId, parts, originalFilename: originalFilenameFromReq, contentType, sizeBytes, teamId } = await req.json();

  if (!key || !uploadId || !Array.isArray(parts) || parts.length === 0) {
    return NextResponse.json({ error: "key, uploadId, parts required" }, { status: 400 });
  }

  // Normalize parts shape and ensure ETag is quoted
  const normalizedParts = (parts as any[])
    .map((p: any) => {
      const partNumber = Number(p.PartNumber ?? p.partNumber);
      let etag: string | undefined = p.ETag ?? p.etag;
      if (etag && !/^".*"$/.test(etag)) {
        etag = `"${etag}"`;
      }
      return { PartNumber: partNumber, ETag: etag };
    })
    .filter((p) => Number.isFinite(p.PartNumber) && !!p.ETag)
    .sort((a, b) => a.PartNumber - b.PartNumber);

  if (normalizedParts.length === 0) {
    return NextResponse.json({ error: "No valid parts provided" }, { status: 400 });
  }

  try {
    const completed = await s3.send(new CompleteMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: normalizedParts,
      },
    }));

    // Get user details from Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    const userName = clerkUser.fullName || clerkUser.firstName || "";
    const userImage = clerkUser.imageUrl || "";

    // Ensure user exists in Supabase
    const { data: user } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        clerkId: userId,
        email: userEmail || "", 
        name: userName, 
        image: userImage,
        updatedAt: new Date().toISOString()
      }, {
        onConflict: 'clerkId'
      })
      .select()
      .single();

    // Get upload lock to retrieve metadata (tolerate missing lock)
    const { data: uploadLock } = await supabaseAdmin
      .from('uploadLocks')
      .select('*')
      .eq('userId', user.id)
      .eq('key', key)
      .maybeSingle();

    // Parse metadata from upload lock if present; otherwise fallback to request body
    const lockMeta: { filename?: string; contentType?: string; teamId?: string | null; videoId?: string } = uploadLock?.metadata ? JSON.parse(uploadLock.metadata) : {};
    const inferredFilename: string = (lockMeta.filename || originalFilenameFromReq || key.split('/').pop() || 'video.mp4') as string;
    const inferredContentType = lockMeta.contentType ?? contentType ?? 'application/octet-stream';
    const lockTeamId = (lockMeta.teamId !== undefined ? lockMeta.teamId : teamId) ?? null;

    const title = String(inferredFilename || "").replace(/\.[^/.]+$/, "") || "Untitled";

    // Derive teamId from metadata or key
    // key pattern: <teamId>/videos/<uploadUuid>/...
    const m = key.match(/([^/]+)\/videos\/(.*?)\//);
    const teamIdFromKey = m && m[1] ? m[1] : null;
    const finalTeamId = lockTeamId ?? teamIdFromKey;

    if (!finalTeamId) {
      return NextResponse.json({ error: "Could not resolve teamId for upload" }, { status: 400 });
    }

    // Validate team access
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, ownerId')
      .eq('id', finalTeamId)
      .single();
    if (teamError || !team) {
      console.error("Team check error:", teamError);
      return NextResponse.json({ error: "Team validation failed" }, { status: 500 });
    }
    if (team.ownerId !== user.id) {
      const { data: membership } = await supabaseAdmin
        .from('team_members')
        .select('id')
        .eq('teamId', finalTeamId)
        .eq('userId', user.id)
        .single();
      if (!membership) {
        return NextResponse.json({ error: "Not a member of this team" }, { status: 403 });
      }
    }

    // Create the video record only after successful upload completion
    // Use stable videoId from init (upload lock metadata) to keep S3 and DB in sync
    const newVideoId = (lockMeta.videoId as string | undefined) || crypto.randomUUID();
    const { data: video, error: videoError } = await supabaseAdmin
      .from('video_posts')
      .insert({
        id: newVideoId,
        key,
        filename: title,
        contentType: inferredContentType,
        sizeBytes: typeof sizeBytes === "number" ? sizeBytes : 0,
        teamId: finalTeamId,
        userId: user.id,
        status: "PROCESSING",
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (videoError) {
      console.error("Video creation error:", videoError);
      return NextResponse.json({ error: "Failed to create video record" }, { status: 500 });
    }

    // Clean up upload lock (best-effort)
    try {
      await supabaseAdmin
        .from('uploadLocks')
        .delete()
        .eq('userId', user.id)
        .eq('key', key);
    } catch {}

    // Precompute canonical key: teams/<teamId>/videos/<videoId>/<originalFilename>
    const fileNameForStorage: string = inferredFilename || "video.mp4";
    const canonicalOriginalKey = `teams/${finalTeamId}/videos/${video.id}/${fileNameForStorage}`;

    // Start background tasks after responding fast
    setTimeout(async () => {
      try {
        // Move original to canonical location using S3 CopyObject to avoid streaming header issues
        try {
          if (key !== canonicalOriginalKey) {
            const copySource = `${process.env.S3_BUCKET!}/${encodeURI(key)}`;
            await s3.send(new CopyObjectCommand({
              Bucket: process.env.S3_BUCKET!,
              Key: canonicalOriginalKey,
              CopySource: copySource,
              MetadataDirective: "REPLACE",
              ContentType: inferredContentType,
            }));

            // Delete the temporary upload object to avoid directory mismatch
            try {
              await s3.send(new DeleteObjectCommand({
                Bucket: process.env.S3_BUCKET!,
                Key: key,
              }));
            } catch (delErr) {
              console.warn("Failed to delete temp upload object:", delErr);
            }

            // Update video.key to canonical path
            await supabaseAdmin
              .from('video_posts')
              .update({ key: canonicalOriginalKey, updatedAt: new Date().toISOString() })
              .eq('id', video.id);
          } else {
            // Key is already canonical; ensure DB reflects it
            await supabaseAdmin
              .from('video_posts')
              .update({ key: canonicalOriginalKey, updatedAt: new Date().toISOString() })
              .eq('id', video.id);
          }
        } catch (e) {
          console.error("Failed to move original to canonical location", e);
        }

        // Transcode with faststart for progressive streaming
        try {
          const tempDir = tmpdir();
          const originalPath = join(tempDir, `original-${key.replace(/\W+/g, '-')}.mp4`);
          const optimizedPath = join(tempDir, `optimized-${key.replace(/\W+/g, '-')}.mp4`);

          // Download original from canonical location
          const getObj = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: canonicalOriginalKey }));
          const body = getObj.Body as NodeJS.ReadableStream;
          await new Promise<void>((resolve, reject) => {
            const ws = createWriteStream(originalPath);
            body.pipe(ws);
            ws.on("finish", () => resolve());
            ws.on("error", reject);
          });

          await new Promise<void>((resolve, reject) => {
            const ff = spawn("ffmpeg", [
              "-y",
              "-i", originalPath,
              "-c:v", "libx264",
              "-preset", "fast",
              "-crf", "23",
              "-maxrate", "3500k",
              "-bufsize", "7000k",
              "-c:a", "aac",
              "-b:a", "128k",
              "-movflags", "+faststart",
              optimizedPath,
            ]);
            ff.on("close", (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)));
            ff.on("error", reject);
          });

          // Upload optimized to a deterministic preview key
          const previewKey = `teams/${finalTeamId}/videos/${video.id}/preview/web.mp4`;
          await s3.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET!,
            Key: previewKey,
            Body: createReadStream(optimizedPath),
            ContentType: "video/mp4",
            CacheControl: "max-age=31536000",
          }));

          try { unlinkSync(originalPath); unlinkSync(optimizedPath); } catch {}
        } catch (e) {
          console.error("Preview optimization failed", e);
        }

        // Broadcast after background work starts
        broadcast({ 
          type: "video.created", 
          teamId: finalTeamId, 
          payload: { id: video.id, title: video.filename }
        });
      } catch (e) {
        console.error("Background tasks error", e);
      }
    }, 0);

    return NextResponse.json({ ok: true, location: completed.Location ?? null, videoId: video.id, 
      keys: {
        baseOwner: finalTeamId,
        original: canonicalOriginalKey,
        preview: `teams/${finalTeamId}/videos/${video.id}/preview/web.mp4`
      }
    });
  } catch (e) {
    console.error("Multipart complete error:", e);
    try {
      await s3.send(new AbortMultipartUploadCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        UploadId: uploadId,
      }));
    } catch {}
    try {
      await supabaseAdmin
        .from('uploadLocks')
        .delete()
        .eq('userId', userId)
        .eq('key', key);
    } catch {}
    return NextResponse.json({ error: "Complete failed" }, { status: 500 });
  }
}