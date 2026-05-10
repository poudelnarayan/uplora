export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { uploadYouTubeThumbnail } from "@/server/services/youtubeUploadService";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "stream";
import { getVideoById, syncUser, getTeamAndRole, updateVideoMetadata } from "@/lib/video-utils";
import { checkTeamCanPublish } from "@/server/services/teamPlatformGuard";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const { id } = context.params;

    const client = await clerkClient();
    const me = await syncUser(userId, await client.users.getUser(userId));

    const video = await getVideoById(id);
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    let hasAccess = video.userId === me.id;
    let team: any = null;

    if (video.teamId) {
      const res = await getTeamAndRole(video.teamId, me.id);
      team = res.team;
      if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
      if (!res.role) return NextResponse.json({ error: "Not an active member of this team" }, { status: 403 });
      hasAccess = true;
    }

    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const platformDecision = await checkTeamCanPublish(video.teamId, "youtube");
    if (!platformDecision.allowed) {
      return NextResponse.json(
        {
          error: platformDecision.reason,
          code: platformDecision.code,
          teamName: platformDecision.teamName,
          enabledPlatforms: platformDecision.enabledPlatforms,
        },
        { status: 403 }
      );
    }

    const youtubeVideoId = video.metadata?.youtube_video_id;
    if (!youtubeVideoId) return NextResponse.json({ error: "Video must be uploaded to YouTube first" }, { status: 400 });
    if (!video.thumbnailKey) return NextResponse.json({ error: "No thumbnail found for this video" }, { status: 400 });

    const publisherUserId = video.teamId ? String(team?.owner_id || "") : userId;

    await updateVideoMetadata(id, {
      youtube_thumbnail_upload_status: "PENDING",
      youtube_thumbnail_upload_error: null,
    });

    const thumbObj = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: video.thumbnailKey }));
    const chunks: Buffer[] = [];
    for await (const chunk of thumbObj.Body as Readable) chunks.push(Buffer.from(chunk));
    const thumbnailBuffer = Buffer.concat(chunks);

    const thumbMimeType = video.thumbnailKey.toLowerCase().endsWith('.png') ? 'image/png'
      : video.thumbnailKey.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg';

    const result = await uploadYouTubeThumbnail(publisherUserId, youtubeVideoId, thumbnailBuffer, thumbMimeType);

    if (result.status === "SUCCESS") {
      await updateVideoMetadata(id, {
        youtube_thumbnail_upload_status: "SUCCESS",
        youtube_thumbnail_upload_error: null,
      });
      return NextResponse.json({ ok: true, status: "SUCCESS", message: "Thumbnail uploaded successfully" });
    } else {
      await updateVideoMetadata(id, {
        youtube_thumbnail_upload_status: "FAILED",
        youtube_thumbnail_upload_error: result.error || "Upload failed",
      });
      return NextResponse.json({ ok: false, status: "FAILED", error: result.error, errorCode: result.errorCode }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Thumbnail retry failed:", err);
    try {
      await updateVideoMetadata(context.params.id, {
        youtube_thumbnail_upload_status: "FAILED",
        youtube_thumbnail_upload_error: err?.message || "Unexpected error",
      });
    } catch {}
    return NextResponse.json({ error: err?.message || "Thumbnail upload failed", status: "FAILED" }, { status: 500 });
  }
}
