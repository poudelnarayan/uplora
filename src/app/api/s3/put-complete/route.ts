export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";
import { S3Client, HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { syncUser } from "@/lib/video-utils";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const DEFAULT_MAX_UPLOAD_BYTES = 5 * 1024 * 1024 * 1024;
const maxFromEnv = Number(process.env.MAX_UPLOAD_BYTES || process.env.MAX_VIDEO_UPLOAD_BYTES);
const MAX_UPLOAD_BYTES = Number.isFinite(maxFromEnv) && maxFromEnv > 0 ? maxFromEnv : DEFAULT_MAX_UPLOAD_BYTES;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Auth required" }, { status: 401 });
    }

    const { key, filename, contentType, sizeBytes, teamId } = await req.json();
    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    const client = await clerkClient();
    const user = await syncUser(userId, await client.users.getUser(userId));

    const m = key.match(/teams\/([^/]+)\/videos\/([^/]+)\//);
    const teamIdFromKey = m?.[1] || null;
    const videoIdFromKey = m?.[2] || null;
    const finalTeamId = teamId ?? teamIdFromKey;

    if (finalTeamId) {
      const { data: team } = await supabaseAdmin
        .from('teams')
        .select('owner_id')
        .eq('id', finalTeamId)
        .single();

      if (team?.owner_id !== user.id) {
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
    }

    const { data: uploadLock } = await supabaseAdmin
      .from('upload_locks')
      .select('*')
      .eq('user_id', user.id)
      .eq('key', key)
      .maybeSingle();

    const lockMeta: { sizeBytes?: number } = uploadLock?.metadata ? JSON.parse(uploadLock.metadata) : {};
    const expectedSize = Number.isFinite(Number(lockMeta.sizeBytes ?? sizeBytes)) ? Number(lockMeta.sizeBytes ?? sizeBytes) : null;

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
      await supabaseAdmin.from('upload_locks').delete().eq('user_id', user.id).eq('key', key);
      return NextResponse.json({ error: "File too large", maxBytes: MAX_UPLOAD_BYTES }, { status: 413 });
    }

    if (expectedSize !== null && actualSize !== expectedSize) {
      try { await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key })); } catch {}
      await supabaseAdmin.from('upload_locks').delete().eq('user_id', user.id).eq('key', key);
      return NextResponse.json({ error: "Uploaded size mismatch" }, { status: 400 });
    }

    const title = String(filename || "").replace(/\.[^/.]+$/, "") || "Untitled";
    const now = new Date().toISOString();
    const newVideoId = videoIdFromKey || crypto.randomUUID();

    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .upsert({
        id: newVideoId,
        post_type: 'video',
        status: 'draft',
        author_id: user.id,
        team_id: finalTeamId,
        metadata: { video_status: 'PROCESSING', filename: title },
        created_at: now,
        updated_at: now,
      }, { onConflict: 'id' })
      .select()
      .single();

    if (postError) {
      console.error("Post creation error:", postError);
      return NextResponse.json({ error: "Failed to create video record" }, { status: 500 });
    }

    const { data: existingMedia } = await supabaseAdmin
      .from('post_media')
      .select('id')
      .eq('post_id', newVideoId)
      .eq('media_type', 'video')
      .maybeSingle();

    if (existingMedia) {
      await supabaseAdmin
        .from('post_media')
        .update({ s3_key: key, filename: title, content_type: contentType || 'application/octet-stream', size_bytes: actualSize })
        .eq('id', existingMedia.id);
    } else {
      await supabaseAdmin
        .from('post_media')
        .insert({ post_id: newVideoId, media_type: 'video', s3_key: key, filename: title, content_type: contentType || 'application/octet-stream', size_bytes: actualSize, position: 0 });
    }

    broadcast({ type: "video.created", teamId: finalTeamId || null, payload: { id: newVideoId, title } });

    await supabaseAdmin.from('upload_locks').delete().eq('user_id', user.id).eq('key', key);

    return NextResponse.json({ success: true, videoId: newVideoId });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("put complete error", e);
    return NextResponse.json({ error: "Failed to complete upload", detail: err?.message }, { status: 500 });
  }
}
