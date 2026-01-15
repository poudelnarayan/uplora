export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { uploadYouTubeThumbnail } from "@/server/services/youtubeUploadService";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "stream";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const { id } = context.params;

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

    // Check access
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
    }

    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (!video.youtubeVideoId) {
      return NextResponse.json({ error: "Video must be uploaded to YouTube first" }, { status: 400 });
    }

    if (!video.thumbnailKey) {
      return NextResponse.json({ error: "No thumbnail found for this video" }, { status: 400 });
    }

    // Determine publisher user ID
    const publisherUserId = video.teamId ? String(team?.ownerId || "") : userId;

    // Update status to PENDING
    await supabaseAdmin
      .from("video_posts")
      .update({
        youtubeThumbnailUploadStatus: "PENDING",
        youtubeThumbnailUploadError: null,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id);

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

    // Determine MIME type
    const thumbMimeType = video.thumbnailKey.toLowerCase().endsWith('.png')
      ? 'image/png'
      : video.thumbnailKey.toLowerCase().endsWith('.webp')
      ? 'image/webp'
      : 'image/jpeg';

    // Upload thumbnail to YouTube
    const result = await uploadYouTubeThumbnail(
      publisherUserId,
      video.youtubeVideoId,
      thumbnailBuffer,
      thumbMimeType
    );

    // Update database
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
    console.error("Thumbnail retry failed:", err);
    
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

