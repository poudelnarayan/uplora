export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";
import type { Readable } from "stream";
import { uploadYouTubeVideo, validateAndNormalizeMetadata, uploadYouTubeThumbnail } from "@/server/services/youtubeUploadService";

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

    // Sync user
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    const userName = clerkUser.fullName || clerkUser.firstName || "";
    const userImage = clerkUser.imageUrl || "";
    const { data: me, error: userError } = await supabaseAdmin
      .from("users")
      .upsert({
        id: userId,
        clerkId: userId,
        email: userEmail || "",
        name: userName,
        image: userImage,
        updatedAt: new Date().toISOString(),
      }, { onConflict: "clerkId" })
      .select()
      .single();
    if (userError) {
      return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
    }

    const { data: video, error: videoError } = await supabaseAdmin
      .from("video_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    let hasAccess = video.userId === me.id;
    let team: any = null;
    let callerRole: "OWNER" | "ADMIN" | "MANAGER" | "EDITOR" | "MEMBER" | null = null;
    if (!hasAccess && video.teamId) {
      const { data: t } = await supabaseAdmin
        .from("teams")
        .select("*")
        .eq("id", video.teamId)
        .single();
      team = t;
      if (t?.ownerId === me.id) {
        hasAccess = true;
        callerRole = "OWNER";
      } else {
        const { data: membership } = await supabaseAdmin
          .from("team_members")
          .select("role,status")
          .eq("teamId", video.teamId)
          .eq("userId", me.id)
          .single();
        if ((membership as any)?.status !== "ACTIVE") {
          return NextResponse.json({ error: "Not an active member of this team" }, { status: 403 });
        }
        callerRole = ((membership as any)?.role as any) || "MEMBER";
        hasAccess = !!membership;
      }
    } else if (video.teamId) {
      const { data: t } = await supabaseAdmin
        .from("teams")
        .select("*")
        .eq("id", video.teamId)
        .single();
      team = t;
      callerRole = team?.ownerId === me.id ? "OWNER" : null;
    }

    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Publishing permissions for team videos:
    // - Owner/Admin: can publish any PENDING video
    // - Editor/Manager: can only publish if video has been approved (approvedByUserId is set)
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

    if (!video.key) {
      return NextResponse.json({ error: "Video storage key missing" }, { status: 400 });
    }

    let metadata;
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
    if (!sizeBytes) {
      return NextResponse.json({ error: "Video size missing. Upload aborted." }, { status: 400 });
    }

    await supabaseAdmin
      .from("video_posts")
      .update({
        youtubeUploadStatus: "UPLOADING",
        youtubeVisibility: metadata.privacyStatus,
        youtubePublishAt: metadata.publishAt,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", video.id);

    const publisherUserId = video.teamId ? String(team?.ownerId || "") : userId;
    if (!publisherUserId) {
      return NextResponse.json({ error: "Team owner missing for publishing" }, { status: 400 });
    }

    const uploadSource = {
      sizeBytes,
      mimeType,
      createReadStream: async (startByte = 0) => {
        const range = startByte > 0 ? `bytes=${startByte}-` : undefined;
        const s3Obj = await s3.send(new GetObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: video.key,
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
          payload: { id: video.id, ...progress },
        });
      } catch {}
    });

    // Upload thumbnail if available (non-blocking - don't fail entire upload if thumbnail fails)
    let thumbnailUploadStatus: "PENDING" | "SUCCESS" | "FAILED" | null = null;
    let thumbnailUploadError: string | null = null;
    
    if (video.thumbnailKey) {
      try {
        // Get thumbnail from S3
        const thumbObj = await s3.send(new GetObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: video.thumbnailKey,
        }));
        
        // Convert stream to buffer
        const chunks: Buffer[] = [];
        for await (const chunk of thumbObj.Body as Readable) {
          chunks.push(Buffer.from(chunk));
        }
        const thumbnailBuffer = Buffer.concat(chunks);
        
        // Determine MIME type from file extension or default to JPEG
        const thumbMimeType = video.thumbnailKey.toLowerCase().endsWith('.png')
          ? 'image/png'
          : video.thumbnailKey.toLowerCase().endsWith('.webp')
          ? 'image/webp'
          : 'image/jpeg';
        
        // Upload thumbnail to YouTube
        const thumbResult = await uploadYouTubeThumbnail(
          publisherUserId,
          uploadResult.youtubeVideoId,
          thumbnailBuffer,
          thumbMimeType
        );
        
        thumbnailUploadStatus = thumbResult.status;
        thumbnailUploadError = thumbResult.error || null;
        
        if (thumbResult.status === "SUCCESS") {
          console.log(`Thumbnail uploaded successfully for video ${uploadResult.youtubeVideoId}`);
        } else {
          console.warn(`Thumbnail upload failed for video ${uploadResult.youtubeVideoId}:`, thumbResult.error);
        }
      } catch (thumbErr: any) {
        // Thumbnail upload failed, but don't fail the entire video upload
        thumbnailUploadStatus = "FAILED";
        thumbnailUploadError = thumbErr?.message || "Failed to upload thumbnail";
        console.error("Thumbnail upload error (non-blocking):", thumbErr);
      }
    }

    await supabaseAdmin
      .from("video_posts")
      .update({
        youtubeVideoId: uploadResult.youtubeVideoId,
        youtubeUploadStatus: uploadResult.uploadStatus,
        youtubePublishAt: uploadResult.publishAt,
        youtubeVisibility: uploadResult.visibility,
        youtubeThumbnailUploadStatus: thumbnailUploadStatus,
        youtubeThumbnailUploadError: thumbnailUploadError,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", video.id);

    return NextResponse.json({
      ok: true,
      youtubeVideoId: uploadResult.youtubeVideoId,
      uploadStatus: uploadResult.uploadStatus,
      thumbnailUploadStatus: thumbnailUploadStatus,
      thumbnailUploadError: thumbnailUploadError,
    });
  } catch (err: any) {
    console.error("YouTube upload failed:", err);
    try {
      const { id } = context.params;
      await supabaseAdmin
        .from("video_posts")
        .update({
          youtubeUploadStatus: "FAILED",
          updatedAt: new Date().toISOString(),
        })
        .eq("id", id);
    } catch {}
    return NextResponse.json({ error: err?.message || "Upload failed" }, { status: 500 });
  }
}

