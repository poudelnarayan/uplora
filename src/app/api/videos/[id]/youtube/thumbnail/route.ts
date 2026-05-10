export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { uploadYouTubeThumbnail, validateThumbnail, type ThumbnailUploadResult } from "@/server/services/youtubeUploadService";
import { getVideoById, syncUser, getTeamAndRole, updateVideoMetadata } from "@/lib/video-utils";
import { checkTeamCanPublish } from "@/server/services/teamPlatformGuard";

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024;

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const { id } = context.params;
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Thumbnail file missing." }, { status: 400 });
    }
    if (!ACCEPTED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Thumbnail must be JPG, PNG, or WEBP.", acceptedTypes: Array.from(ACCEPTED_TYPES) }, { status: 400 });
    }
    if (file.size > MAX_THUMBNAIL_BYTES) {
      return NextResponse.json({ error: `Thumbnail exceeds 2MB limit. Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`, maxSize: MAX_THUMBNAIL_BYTES }, { status: 400 });
    }

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
    if (video.teamId && callerRole !== "OWNER" && callerRole !== "ADMIN") {
      return NextResponse.json({ error: "Only owner/admin can update team thumbnails." }, { status: 403 });
    }

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
    if (!youtubeVideoId) return NextResponse.json({ error: "YouTube videoId missing. Upload first." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = validateThumbnail(buffer, file.type);
    if (!validation.valid) {
      await updateVideoMetadata(id, {
        youtube_thumbnail_upload_status: "FAILED",
        youtube_thumbnail_upload_error: validation.error || "Validation failed",
      });
      return NextResponse.json({ error: validation.error, status: "FAILED" }, { status: 400 });
    }

    const publisherUserId = video.teamId ? String(team?.owner_id || "") : userId;

    await updateVideoMetadata(id, {
      youtube_thumbnail_upload_status: "PENDING",
      youtube_thumbnail_upload_error: null,
    });

    const result: ThumbnailUploadResult = await uploadYouTubeThumbnail(publisherUserId, youtubeVideoId, buffer, file.type);

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
    console.error("Thumbnail upload failed:", err);
    try {
      await updateVideoMetadata(context.params.id, {
        youtube_thumbnail_upload_status: "FAILED",
        youtube_thumbnail_upload_error: err?.message || "Unexpected error",
      });
    } catch {}
    return NextResponse.json({ error: err?.message || "Thumbnail upload failed", status: "FAILED" }, { status: 500 });
  }
}
