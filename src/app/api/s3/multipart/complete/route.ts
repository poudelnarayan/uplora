export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { S3Client, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";
import { tmpdir } from "os";
import { join } from "path";
import { createWriteStream, createReadStream, unlinkSync } from "fs";
import { spawn } from "child_process";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, uploadId, parts, originalFilename, contentType, sizeBytes, teamId } = await req.json();

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
    const { data: user, error: userError } = await supabaseAdmin
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

    if (userError) {
      console.error("User sync error:", userError);
      return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
    }

    // Get upload lock to retrieve metadata
    const { data: uploadLock, error: lockError } = await supabaseAdmin
      .from('upload_locks')
      .select('*')
      .eq('userId', user.id)
      .eq('key', key)
      .single();

    if (lockError || !uploadLock) {
      console.error("Upload lock error:", lockError);
      return NextResponse.json({ error: "Upload lock not found" }, { status: 404 });
    }

    // Parse metadata from upload lock
    const metadata = uploadLock.metadata ? JSON.parse(uploadLock.metadata) : {};
    const { filename: originalFilename, contentType, teamId: lockTeamId } = metadata;

    const title = String(originalFilename || "").replace(/\.[^/.]+$/, "") || "Untitled";

    // Derive teamId from key if not in metadata
    const m = key.match(/(?:teams\/(.*?)|users\/(.*?))\/videos\/(.*?)\//);
    const teamIdFromKey = m && m[1] ? m[1] : null;
    const finalTeamId = lockTeamId ?? teamId ?? teamIdFromKey;

    // Validate team access if teamId is provided
    if (finalTeamId) {
      // Check if user is the team owner
      const { data: team, error: teamError } = await supabaseAdmin
        .from('teams')
        .select('*')
        .eq('id', finalTeamId)
        .eq('ownerId', user.id)
        .single();
      
      if (teamError && teamError.code !== 'PGRST116') {
        console.error("Team check error:", teamError);
        return NextResponse.json({ error: "Team validation failed" }, { status: 500 });
      }
      
      if (!team) {
        // If not owner, check if user is a team member
        const { data: membership, error: memberError } = await supabaseAdmin
          .from('team_members')
          .select('*')
          .eq('teamId', finalTeamId)
          .eq('userId', user.id)
          .single();
          
        if (memberError && memberError.code !== 'PGRST116') {
          console.error("Membership check error:", memberError);
          return NextResponse.json({ error: "Membership validation failed" }, { status: 500 });
        }
        
        if (!membership) {
          return NextResponse.json({ error: "Not a member of this team" }, { status: 403 });
        }
      }
    }

    // Create the video record only after successful upload completion
    const { data: video, error: videoError } = await supabaseAdmin
      .from('videos')
      .insert({
        key,
        filename: title,
        contentType: contentType || "application/octet-stream",
        sizeBytes: typeof sizeBytes === "number" ? sizeBytes : 0,
        teamId: finalTeamId,
        userId: user.id,
        status: "PROCESSING",
      })
      .select()
      .single();

    if (videoError) {
      console.error("Video creation error:", videoError);
      return NextResponse.json({ error: "Failed to create video record" }, { status: 500 });
    }

    // Broadcast video creation event
    broadcast({ 
      type: "video.created", 
      teamId: video.teamId || null, 
      payload: { id: video.id, title: video.filename }
    });

    // Clean up upload lock
    const { error: cleanupError } = await supabaseAdmin
      .from('upload_locks')
      .delete()
      .eq('userId', user.id)
      .eq('key', key);

    if (cleanupError) {
      console.error("Upload lock cleanup error:", cleanupError);
      // Don't fail the request for cleanup errors
    }

    // Fire-and-forget background optimization for fast web preview
    setTimeout(async () => {
      try {
        const tempDir = tmpdir();
        const originalPath = join(tempDir, `original-${key.replace(/\W+/g, '-')}.mp4`);
        const optimizedPath = join(tempDir, `optimized-${key.replace(/\W+/g, '-')}.mp4`);

        // Download original
        const getObj = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }));
        const body = getObj.Body as NodeJS.ReadableStream;
        await new Promise<void>((resolve, reject) => {
          const ws = createWriteStream(originalPath);
          body.pipe(ws);
          ws.on("finish", () => resolve());
          ws.on("error", reject);
        });

        // Transcode with faststart for progressive streaming
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
        const previewKey = (finalTeamId
          ? `teams/${finalTeamId}/videos/${video.id}/preview/web.mp4`
          : `users/${user.id}/videos/${video.id}/preview/web.mp4`);
        await s3.send(new PutObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: previewKey,
          Body: createReadStream(optimizedPath),
          ContentType: "video/mp4",
          CacheControl: "max-age=31536000",
        }));

        // Cleanup temp files
        try { unlinkSync(originalPath); unlinkSync(optimizedPath); } catch {}
      } catch (e) {
        // Silent fail; preview will fall back
        console.error("Preview optimization failed", e);
      }
    }, 0);

    return NextResponse.json({ ok: true, location: completed.Location ?? null, videoId: video.id });
  } catch (e) {
    console.error("Multipart complete error:", e);
    try {
      await s3.send(new AbortMultipartUploadCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        UploadId: uploadId,
      }));
    } catch (abortError) {
      console.error("Failed to abort multipart upload:", abortError);
    }
    // Release lock on error too
    try {
      await supabaseAdmin
        .from('upload_locks')
        .delete()
        .eq('userId', userId)
        .eq('key', key);
    } catch (cleanupError) {
      console.error("Failed to cleanup upload lock:", cleanupError);
    }
    return NextResponse.json({ error: "Complete failed" }, { status: 500 });
  }
}