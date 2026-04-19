export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { broadcast } from "@/lib/realtime";
import { VideoStatus } from "@/types/videoStatus";
import { getVideoById, getTeamAndRole, updateVideoStatus } from "@/lib/video-utils";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const { key: newKey, filename } = await req.json();
    if (!newKey || !filename) return NextResponse.json({ error: "key and filename required" }, { status: 400 });

    const video = await getVideoById(id);
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    if (!video.teamId) {
      if (video.userId !== userId) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    } else {
      const { role } = await getTeamAndRole(video.teamId, userId);
      if (!role || !["OWNER", "ADMIN", "MANAGER"].includes(role)) {
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
      }
    }

    const oldKey = video.key;

    // Update or insert media row with new key
    const { data: existingMedia } = await supabaseAdmin
      .from('post_media')
      .select('id')
      .eq('post_id', id)
      .eq('media_type', 'video')
      .maybeSingle();

    if (existingMedia) {
      await supabaseAdmin
        .from('post_media')
        .update({ s3_key: newKey, filename })
        .eq('id', existingMedia.id);
    } else {
      await supabaseAdmin
        .from('post_media')
        .insert({ post_id: id, media_type: 'video', s3_key: newKey, filename, position: 0 });
    }

    const updated = await updateVideoStatus(id, VideoStatus.PROCESSING, {
      requested_by_user_id: null,
      approved_by_user_id: null,
    });

    if (oldKey && oldKey !== newKey) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: oldKey }));
      } catch (e) {
        console.warn("Failed to delete old video key", oldKey, e);
      }
    }

    broadcast({
      type: "video.status",
      teamId: video.teamId || null,
      payload: { id, status: "PROCESSING", requestedByUserId: null, approvedByUserId: null }
    });
    if (video.teamId) {
      broadcast({ type: "post.status", teamId: video.teamId, payload: { id, status: "PROCESSING", contentType: "video" } });
    }
    return NextResponse.json({ ok: true, video: updated });
  } catch (e) {
    console.error("[replace/complete] unexpected:", e);
    return NextResponse.json({ error: "Failed to finalize replace" }, { status: 500 });
  }
}
