export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { broadcast } from "@/lib/realtime";
import type { Readable } from "stream";
import { uploadYouTubeVideo, validateAndNormalizeMetadata, uploadYouTubeThumbnail } from "@/server/services/youtubeUploadService";
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
    const body = await req.json().catch(() => ({}));

    const client = await clerkClient();
    const me = await syncUser(userId, await client.users.getUser(userId));

    const video = await getVideoById(id);
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    let hasAccess = video.userId === me.id;
    let team: any = null;
    let callerRole: string | null = null;

    if (video.teamId) {
      const res = await getTeamAndRole(video.teamId, me.id);
      team = res.team;
      callerRole = res.role;
      if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
      if (!callerRole) return NextResponse.json({ error: "Not an active member of this team" }, { status: 403 });
      hasAccess = true;
    }

    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Per-team platform allowlist guard. Personal teams pass through.
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

    if (video.teamId) {
      const isOwnerOrAdmin = callerRole === "OWNER" || callerRole === "ADMIN";
      const isEditorOrManager = callerRole === "EDITOR" || callerRole === "MANAGER";
      const isApproved = !!video.approvedByUserId;

      if (isEditorOrManager && !isApproved) {
        return NextResponse.json({
          error: "This video needs to be approved by an owner/admin before you can publish it to YouTube."
        }, { status: 403 });
      }
      if (!isOwnerOrAdmin && !isEditorOrManager) {
        return NextResponse.json({ error: "Not allowed to publish this team video" }, { status: 403 });
      }
    }

    if (!video.key) return NextResponse.json({ error: "Video storage key missing" }, { status: 400 });

    let metadata: any;
    try {
      const title = body?.title || (video.filename ? video.filename.replace(/\.[^/.]+$/, "") : "Untitled");
      metadata = validateAndNormalizeMetadata({
        title,
        description: body?.description || "",
        tags: body?.tags,
        categoryId: body?.categoryId,
        defaultLanguage: body?.defaultLanguage,
        defaultAudioLanguage: body?.defaultAudioLanguage,
        privacyStatus: body?.privacyStatus || "private",
        publishAt: body?.publishAt || null,
        madeForKids: body?.madeForKids,
        selfDeclaredMadeForKids: body?.selfDeclaredMadeForKids,
      });
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || "Invalid metadata" }, { status: 400 });
    }

    const head = await s3.send(new HeadObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: video.key }));
    const sizeBytes = Number(head.ContentLength || 0);
    const mimeType = head.ContentType || video.contentType || "video/mp4";
    if (!sizeBytes) return NextResponse.json({ error: "Video size missing. Upload aborted." }, { status: 400 });

    await updateVideoMetadata(id, {
      youtube_upload_status: "UPLOADING",
      youtube_visibility: metadata.privacyStatus,
      youtube_publish_at: metadata.publishAt,
    });

    const publisherUserId = video.teamId ? String(team?.owner_id || "") : userId;
    if (!publisherUserId) return NextResponse.json({ error: "Team owner missing for publishing" }, { status: 400 });

    const uploadSource = {
      sizeBytes,
      mimeType,
      createReadStream: async (startByte = 0) => {
        const range = startByte > 0 ? `bytes=${startByte}-` : undefined;
        const s3Obj = await s3.send(new GetObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: video.key!,
          Range: range,
        }));
        return s3Obj.Body as Readable;
      },
    };

    const uploadResult = await uploadYouTubeVideo(publisherUserId, uploadSource, metadata, progress => {
      try {
        broadcast({
          type: "youtube.upload.progress",
          teamId: video.teamId || null,
          userId: video.teamId ? null : userId,
          payload: { id, ...progress },
        });
      } catch {}
    });

    let thumbnailUploadStatus: string | null = null;
    let thumbnailUploadError: string | null = null;

    if (video.thumbnailKey) {
      try {
        const thumbObj = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: video.thumbnailKey }));
        const chunks: Buffer[] = [];
        for await (const chunk of thumbObj.Body as Readable) chunks.push(Buffer.from(chunk));
        const thumbnailBuffer = Buffer.concat(chunks);

        const thumbMimeType = video.thumbnailKey.toLowerCase().endsWith('.png') ? 'image/png'
          : video.thumbnailKey.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg';

        const thumbResult = await uploadYouTubeThumbnail(publisherUserId, uploadResult.youtubeVideoId, thumbnailBuffer, thumbMimeType);
        thumbnailUploadStatus = thumbResult.status;
        thumbnailUploadError = thumbResult.error || null;
      } catch (thumbErr: any) {
        thumbnailUploadStatus = "FAILED";
        thumbnailUploadError = thumbErr?.message || "Failed to upload thumbnail";
      }
    }

    await updateVideoMetadata(id, {
      youtube_video_id: uploadResult.youtubeVideoId,
      youtube_upload_status: uploadResult.uploadStatus,
      youtube_publish_at: uploadResult.publishAt,
      youtube_visibility: uploadResult.visibility,
      youtube_thumbnail_upload_status: thumbnailUploadStatus,
      youtube_thumbnail_upload_error: thumbnailUploadError,
    });

    return NextResponse.json({
      ok: true,
      youtubeVideoId: uploadResult.youtubeVideoId,
      uploadStatus: uploadResult.uploadStatus,
      thumbnailUploadStatus,
      thumbnailUploadError,
    });
  } catch (err: any) {
    console.error("YouTube upload failed:", err);
    try {
      await updateVideoMetadata(context.params.id, { youtube_upload_status: "FAILED" });
    } catch {}
    return NextResponse.json({ error: err?.message || "Upload failed" }, { status: 500 });
  }
}
