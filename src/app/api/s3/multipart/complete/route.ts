export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { S3Client, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, GetObjectCommand, PutObjectCommand, CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";
import { tmpdir } from "os";
import { join } from "path";
import { createWriteStream, createReadStream, unlinkSync } from "fs";
import { spawn } from "child_process";
import crypto from "crypto";
import { syncUser } from "@/lib/video-utils";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const DEFAULT_MAX_UPLOAD_BYTES = 5 * 1024 * 1024 * 1024;
const maxFromEnv = Number(process.env.MAX_UPLOAD_BYTES || process.env.MAX_VIDEO_UPLOAD_BYTES);
const MAX_UPLOAD_BYTES = Number.isFinite(maxFromEnv) && maxFromEnv > 0 ? maxFromEnv : DEFAULT_MAX_UPLOAD_BYTES;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, uploadId, parts, originalFilename: originalFilenameFromReq, contentType, sizeBytes, teamId } = await req.json();

  if (!key || !uploadId || !Array.isArray(parts) || parts.length === 0) {
    return NextResponse.json({ error: "key, uploadId, parts required" }, { status: 400 });
  }

  const normalizedParts = (parts as any[])
    .map((p: any) => {
      const partNumber = Number(p.PartNumber ?? p.partNumber);
      let etag: string | undefined = p.ETag ?? p.etag;
      if (etag && !/^".*"$/.test(etag)) etag = `"${etag}"`;
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
      MultipartUpload: { Parts: normalizedParts },
    }));

    const client = await clerkClient();
    const user = await syncUser(userId, await client.users.getUser(userId));

    const { data: uploadLock } = await supabaseAdmin
      .from('upload_locks')
      .select('*')
      .eq('user_id', user.id)
      .eq('key', key)
      .maybeSingle();

    const lockMeta: { filename?: string; contentType?: string; teamId?: string | null; videoId?: string; sizeBytes?: number } =
      uploadLock?.metadata ? JSON.parse(uploadLock.metadata) : {};

    const inferredFilename: string = (lockMeta.filename || originalFilenameFromReq || key.split('/').pop() || 'video.mp4') as string;
    const inferredContentType = lockMeta.contentType ?? contentType ?? 'application/octet-stream';
    const lockTeamId = (lockMeta.teamId !== undefined ? lockMeta.teamId : teamId) ?? null;
    const expectedSize = Number.isFinite(Number(lockMeta.sizeBytes ?? sizeBytes)) ? Number(lockMeta.sizeBytes ?? sizeBytes) : null;
    const title = String(inferredFilename || "").replace(/\.[^/.]+$/, "") || "Untitled";

    const m = key.match(/([^/]+)\/videos\/(.*?)\//);
    const teamIdFromKey = m && m[1] ? m[1] : null;
    const finalTeamId = lockTeamId ?? teamIdFromKey;

    if (!finalTeamId) {
      return NextResponse.json({ error: "Could not resolve teamId for upload" }, { status: 400 });
    }

    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, owner_id')
      .eq('id', finalTeamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: "Team validation failed" }, { status: 500 });
    }

    if (team.owner_id !== user.id) {
      const { data: membership } = await supabaseAdmin
        .from('team_members')
        .select('id')
        .eq('team_id', finalTeamId)
        .eq('user_id', user.id)
        .single();
      if (!membership) {
        return NextResponse.json({ error: "Not a member of this team" }, { status: 403 });
      }
    }

    let actualSize = 0;
    try {
      const head = await s3.send(new HeadObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }));
      actualSize = Number(head.ContentLength || 0);
    } catch {
      return NextResponse.json({ error: "Upload validation failed" }, { status: 500 });
    }

    if (!actualSize) return NextResponse.json({ error: "Uploaded file has no size" }, { status: 400 });

    if (actualSize > MAX_UPLOAD_BYTES) {
      try { await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key })); } catch {}
      try { await supabaseAdmin.from('upload_locks').delete().eq('user_id', user.id).eq('key', key); } catch {}
      return NextResponse.json({ error: "File too large", maxBytes: MAX_UPLOAD_BYTES }, { status: 413 });
    }

    if (expectedSize !== null && actualSize !== expectedSize) {
      try { await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key })); } catch {}
      try { await supabaseAdmin.from('upload_locks').delete().eq('user_id', user.id).eq('key', key); } catch {}
      return NextResponse.json({ error: "Uploaded size mismatch" }, { status: 400 });
    }

    const newVideoId = (lockMeta.videoId as string | undefined) || crypto.randomUUID();
    const now = new Date().toISOString();

    // Check if post already exists (re-upload case)
    const { data: existingPost } = await supabaseAdmin
      .from("posts")
      .select("id, author_id, team_id, metadata")
      .eq("id", newVideoId)
      .maybeSingle();

    const { data: post, error: postError } = await supabaseAdmin
      .from("posts")
      .upsert({
        id: newVideoId,
        post_type: 'video',
        status: 'draft',
        author_id: existingPost?.author_id || user.id,
        team_id: existingPost?.team_id || finalTeamId,
        metadata: { ...(existingPost?.metadata || {}), video_status: 'PROCESSING', filename: existingPost?.metadata?.filename || title },
        updated_at: now,
        created_at: existingPost ? undefined : now,
      }, { onConflict: "id" })
      .select()
      .single();

    if (postError) {
      console.error("Post creation error:", postError);
      return NextResponse.json({ error: "Failed to create video record" }, { status: 500 });
    }

    // Upsert post_media
    const { data: existingMedia } = await supabaseAdmin
      .from('post_media')
      .select('id')
      .eq('post_id', newVideoId)
      .eq('media_type', 'video')
      .maybeSingle();

    if (existingMedia) {
      await supabaseAdmin
        .from('post_media')
        .update({ s3_key: key, filename: inferredFilename, content_type: inferredContentType, size_bytes: actualSize })
        .eq('id', existingMedia.id);
    } else {
      await supabaseAdmin
        .from('post_media')
        .insert({ post_id: newVideoId, media_type: 'video', s3_key: key, filename: inferredFilename, content_type: inferredContentType, size_bytes: actualSize, position: 0 });
    }

    try { await supabaseAdmin.from('upload_locks').delete().eq('user_id', user.id).eq('key', key); } catch {}

    const fileNameForStorage: string = inferredFilename || "video.mp4";
    const canonicalOriginalKey = `teams/${finalTeamId}/videos/${post.id}/${fileNameForStorage}`;

    try {
      if (key !== canonicalOriginalKey) {
        await s3.send(new CopyObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: canonicalOriginalKey,
          CopySource: `${process.env.S3_BUCKET!}/${encodeURI(key)}`,
          MetadataDirective: "REPLACE",
          ContentType: inferredContentType,
        }));
        try { await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key })); } catch {}

        await supabaseAdmin
          .from('post_media')
          .update({ s3_key: canonicalOriginalKey })
          .eq('post_id', post.id)
          .eq('media_type', 'video');
      }
    } catch (e) {
      console.error("Failed to move original to canonical location", e);
    }

    // Transcode with faststart for progressive streaming
    try {
      const tempDir = tmpdir();
      const originalPath = join(tempDir, `original-${key.replace(/\W+/g, '-')}.mp4`);
      const optimizedPath = join(tempDir, `optimized-${key.replace(/\W+/g, '-')}.mp4`);

      let getObj;
      try {
        getObj = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: canonicalOriginalKey }));
      } catch (err) {
        if (key !== canonicalOriginalKey) {
          getObj = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }));
        } else {
          throw err;
        }
      }
      const body = getObj.Body as NodeJS.ReadableStream;
      await new Promise<void>((resolve, reject) => {
        const ws = createWriteStream(originalPath);
        body.pipe(ws);
        ws.on("finish", resolve);
        ws.on("error", reject);
      });

      await new Promise<void>((resolve, reject) => {
        const ff = spawn("ffmpeg", ["-y", "-i", originalPath, "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-maxrate", "3500k", "-bufsize", "7000k", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", optimizedPath]);
        ff.on("close", (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)));
        ff.on("error", reject);
      });

      const previewKey = `teams/${finalTeamId}/videos/${post.id}/preview/web.mp4`;
      await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: previewKey, Body: createReadStream(optimizedPath), ContentType: "video/mp4", CacheControl: "max-age=31536000" }));

      try { unlinkSync(originalPath); unlinkSync(optimizedPath); } catch {}
    } catch (e) {
      console.error("Preview optimization failed", e);
    }

    broadcast({ type: "video.created", teamId: finalTeamId, payload: { id: post.id, title } });

    return NextResponse.json({
      ok: true,
      location: completed.Location ?? null,
      videoId: post.id,
      keys: {
        baseOwner: finalTeamId,
        original: canonicalOriginalKey,
        preview: `teams/${finalTeamId}/videos/${post.id}/preview/web.mp4`
      }
    });
  } catch (e) {
    console.error("Multipart complete error:", e);
    try {
      await s3.send(new AbortMultipartUploadCommand({ Bucket: process.env.S3_BUCKET!, Key: key, UploadId: uploadId }));
    } catch {}
    try {
      await supabaseAdmin.from('upload_locks').delete().eq('user_id', userId).eq('key', key);
    } catch {}
    return NextResponse.json({ error: "Complete failed" }, { status: 500 });
  }
}
