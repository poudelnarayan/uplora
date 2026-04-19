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

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

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

    // Clear the video media row, reset to PROCESSING
    if (oldKey) {
      await supabaseAdmin
        .from('post_media')
        .delete()
        .eq('post_id', id)
        .eq('media_type', 'video');
    }

    const updated = await updateVideoStatus(id, VideoStatus.PROCESSING, {
      requested_by_user_id: null,
      approved_by_user_id: null,
    });

    if (oldKey) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: oldKey }));
      } catch (e) {
        console.warn("Failed to delete old key", oldKey, e);
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
    console.error("[file delete] unexpected:", e);
    return NextResponse.json({ error: "Failed to delete video file" }, { status: 500 });
  }
}
