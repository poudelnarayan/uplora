export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { uploadYouTubeThumbnail, validateThumbnail, type ThumbnailUploadResult } from "@/server/services/youtubeUploadService";

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024; // 2MB (YouTube limit)

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

    // Validate file type
    if (!ACCEPTED_TYPES.has(file.type)) {
      return NextResponse.json({ 
        error: "Thumbnail must be JPG, PNG, or WEBP.",
        acceptedTypes: Array.from(ACCEPTED_TYPES)
      }, { status: 400 });
    }
    
    // Validate file size
    if (file.size > MAX_THUMBNAIL_BYTES) {
      return NextResponse.json({ 
        error: `Thumbnail exceeds 2MB limit. Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        maxSize: MAX_THUMBNAIL_BYTES
      }, { status: 400 });
    }

    // Sync user
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    const userName = clerkUser.fullName || clerkUser.firstName || "";
    const userImage = clerkUser.imageUrl || "";
    const { data: me } = await supabaseAdmin
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
    if (video.teamId && callerRole !== "OWNER" && callerRole !== "ADMIN") {
      return NextResponse.json({ error: "Only owner/admin can update team thumbnails." }, { status: 403 });
    }

    if (!video.youtubeVideoId) {
      return NextResponse.json({ error: "YouTube videoId missing. Upload first." }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Additional validation using service function
    const validation = validateThumbnail(buffer, file.type);
    if (!validation.valid) {
      // Update database with failed status
      await supabaseAdmin
        .from("video_posts")
        .update({
          youtubeThumbnailUploadStatus: "FAILED",
          youtubeThumbnailUploadError: validation.error || "Validation failed",
          updatedAt: new Date().toISOString(),
        })
        .eq("id", id);
      
      return NextResponse.json({ 
        error: validation.error,
        status: "FAILED"
      }, { status: 400 });
    }

    // Determine publisher user ID (team owner for team videos, current user for personal)
    const publisherUserId = video.teamId ? String(team?.ownerId || "") : userId;

    // Update database: set status to PENDING
    await supabaseAdmin
      .from("video_posts")
      .update({
        youtubeThumbnailUploadStatus: "PENDING",
        youtubeThumbnailUploadError: null,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id);

    // Upload thumbnail to YouTube
    const result: ThumbnailUploadResult = await uploadYouTubeThumbnail(
      publisherUserId,
      video.youtubeVideoId,
      buffer,
      file.type
    );

    // Update database with upload result
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (result.status === "SUCCESS") {
      updateData.youtubeThumbnailUploadStatus = "SUCCESS";
      updateData.youtubeThumbnailUploadError = null;
    } else {
      updateData.youtubeThumbnailUploadStatus = "FAILED";
      updateData.youtubeThumbnailUploadError = result.error || "Upload failed";
    }

    await supabaseAdmin
      .from("video_posts")
      .update(updateData)
      .eq("id", id);

    if (result.status === "SUCCESS") {
      return NextResponse.json({ 
        ok: true, 
        status: "SUCCESS",
        message: "Thumbnail uploaded successfully"
      });
    } else {
      return NextResponse.json({ 
        ok: false,
        status: "FAILED",
        error: result.error,
        errorCode: result.errorCode
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Thumbnail upload failed:", err);
    
    // Update database with failed status
    try {
      await supabaseAdmin
        .from("video_posts")
        .update({
          youtubeThumbnailUploadStatus: "FAILED",
          youtubeThumbnailUploadError: err?.message || "Unexpected error",
          updatedAt: new Date().toISOString(),
        })
        .eq("id", context.params.id);
    } catch (dbErr) {
      console.error("Failed to update database:", dbErr);
    }
    
    return NextResponse.json({ 
      error: err?.message || "Thumbnail upload failed",
      status: "FAILED"
    }, { status: 500 });
  }
}

