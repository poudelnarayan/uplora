export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendMail } from "@/lib/email";
import { broadcast } from "@/lib/realtime";
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "stream";
import { uploadYouTubeVideo, validateAndNormalizeMetadata, uploadYouTubeThumbnail } from "@/server/services/youtubeUploadService";
import { VideoStatus } from "@/types/videoStatus";
import { getVideoById, syncUser, getTeamAndRole, updateVideoStatus, updateVideoMetadata } from "@/lib/video-utils";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const client = await clerkClient();
    const me = await syncUser(userId, await client.users.getUser(userId));

    const video = await getVideoById(id);
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    // Authorization + workflow rules
    let team: any = null;
    let callerRole: string | null = null;

    if (video.teamId) {
      const res = await getTeamAndRole(video.teamId, me.id);
      team = res.team;
      callerRole = res.role;

      if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
      if (!callerRole) return NextResponse.json({ error: "Not an active member of this team" }, { status: 403 });

      const upperStatus = video.status;
      const isOwnerOrAdmin = callerRole === "OWNER" || callerRole === "ADMIN";
      const isEditorOrManager = callerRole === "EDITOR" || callerRole === "MANAGER";
      const isApproved = upperStatus === VideoStatus.APPROVAL_APPROVED;

      if (isEditorOrManager && !isApproved) {
        return NextResponse.json({ error: "This video needs to be approved by an owner/admin before you can publish it." }, { status: 403 });
      }
      if (!isOwnerOrAdmin && !isEditorOrManager) {
        return NextResponse.json({ error: "Not allowed to publish this team video" }, { status: 403 });
      }

      const readyStatuses = [VideoStatus.READY_TO_PUBLISH, VideoStatus.APPROVAL_REQUESTED, VideoStatus.APPROVAL_APPROVED];
      if (!readyStatuses.includes(upperStatus)) {
        return NextResponse.json({ error: "This video is not ready to publish yet." }, { status: 400 });
      }
    } else {
      if (video.userId !== me.id) return NextResponse.json({ error: "Not allowed to publish this video" }, { status: 403 });
    }

    const rawPayload = await req.json().catch(() => ({}));
    const publisherUserId = video.teamId ? String(team?.owner_id || "") : userId;
    if (!publisherUserId) return NextResponse.json({ error: "Team owner missing for publishing" }, { status: 400 });

    const safeTitle = rawPayload?.title || video.filename?.replace(/\.[^/.]+$/, '') || "Untitled";
    let metadata: any;
    try {
      metadata = validateAndNormalizeMetadata({
        title: safeTitle,
        description: rawPayload?.description || "",
        tags: rawPayload?.tags,
        categoryId: rawPayload?.categoryId,
        defaultLanguage: rawPayload?.defaultLanguage,
        defaultAudioLanguage: rawPayload?.defaultAudioLanguage,
        privacyStatus: rawPayload?.privacyStatus || "private",
        publishAt: rawPayload?.publishAt || null,
        madeForKids: rawPayload?.madeForKids,
        selfDeclaredMadeForKids: rawPayload?.selfDeclaredMadeForKids,
      });
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || "Invalid metadata" }, { status: 400 });
    }

    if (!video.key) return NextResponse.json({ error: "Video storage key missing" }, { status: 400 });

    const head = await s3.send(new HeadObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: video.key }));
    const sizeBytes = Number(head.ContentLength || 0);
    const mimeType = head.ContentType || video.contentType || "video/mp4";
    if (!sizeBytes) return NextResponse.json({ error: "Video size missing. Upload aborted." }, { status: 400 });

    const uploadSource = {
      sizeBytes,
      mimeType,
      createReadStream: async (startByte = 0) => {
        const range = startByte > 0 ? `bytes=${startByte}-` : undefined;
        const s3Obj = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: video.key!, Range: range }));
        return s3Obj.Body as Readable;
      },
    };

    await updateVideoMetadata(id, {
      youtube_upload_status: "UPLOADING",
      youtube_visibility: metadata.privacyStatus,
      youtube_publish_at: metadata.publishAt,
    });

    let uploadResult: any;
    try {
      uploadResult = await uploadYouTubeVideo(publisherUserId, uploadSource, metadata);
    } catch (err: any) {
      await updateVideoMetadata(id, { youtube_upload_status: "FAILED" });
      return NextResponse.json({ error: err?.message || "YouTube upload failed" }, { status: 500 });
    }

    const newStatus = uploadResult.uploadStatus === "SCHEDULED" ? VideoStatus.SCHEDULED : VideoStatus.POSTED;

    // Upload thumbnail if available
    let thumbnailUploadStatus: string | null = null;
    let thumbnailUploadError: string | null = null;

    if (video.thumbnailKey) {
      try {
        thumbnailUploadStatus = "PENDING";
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

    const updated = await updateVideoStatus(id, newStatus, {
      approved_by_user_id: video.approvedByUserId || me.id,
      requested_by_user_id: null,
      youtube_video_id: uploadResult.youtubeVideoId,
      youtube_upload_status: uploadResult.uploadStatus,
      youtube_publish_at: uploadResult.publishAt,
      youtube_visibility: uploadResult.visibility,
      youtube_thumbnail_upload_status: thumbnailUploadStatus,
      youtube_thumbnail_upload_error: thumbnailUploadError,
    });

    // Notify requester
    const requesterId = video.requestedByUserId;
    if (video.teamId && requesterId) {
      try {
        const { data: requester } = await supabaseAdmin.from('users').select('email, name').eq('id', requesterId).single();
        if (requester?.email) {
          const videoTitle = video.filename?.replace(/\.[^/.]+$/, '') || 'Video';
          const videoUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/videos/${id}`;
          await sendMail({
            to: requester.email,
            subject: `✅ Video Published: ${videoTitle}`,
            html: `<div><h2>✅ Video Published!</h2><p>Video: ${videoTitle}</p><p><a href="${videoUrl}">View</a></p></div>`,
            text: `Video Published!\nVideo: ${videoTitle}\n${videoUrl}`,
          });
        }
      } catch {}
    }

    broadcast({ type: "video.status", teamId: video.teamId || null, payload: { id, status: newStatus, requestedByUserId: null, approvedByUserId: me.id } });
    if (video.teamId) {
      broadcast({ type: "post.status", teamId: video.teamId, payload: { id, status: newStatus, contentType: "video" } });
    }

    return NextResponse.json({
      ok: true, success: true, video: updated,
      youtubeVideoId: uploadResult.youtubeVideoId,
      thumbnailUploadStatus, thumbnailUploadError,
      uploadStatus: uploadResult.uploadStatus,
      message: "Video uploaded successfully to YouTube",
    });
  } catch (e) {
    console.error("Error approving video:", e);
    return NextResponse.json({ error: "Failed to approve video" }, { status: 500 });
  }
}
