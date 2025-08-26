export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const { filename, contentType, videoId } = await req.json();
    if (!filename || !contentType) return NextResponse.json({ error: "Missing filename/contentType" }, { status: 400 });
    if (!videoId) return NextResponse.json({ error: "Missing videoId" }, { status: 400 });

    // Validate it's a supported image format (YouTube requirements)
    const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'];
    if (!supportedTypes.includes(contentType)) {
      return NextResponse.json({ error: "Only JPG, PNG, GIF, or BMP files are allowed for thumbnails" }, { status: 400 });
    }

    // Build safe S3 key for thumbnails
    const safeName = String(filename).replace(/[^\w.\- ]+/g, "_");

    // Get user details from Clerk and sync with Supabase
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    const userName = clerkUser.fullName || clerkUser.firstName || "";
    const userImage = clerkUser.imageUrl || "";

    // Ensure user exists in Supabase
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        clerkId: userId,
        email: userEmail || "", 
        name: userName, 
        image: userImage,
        updatedAt: new Date().toISOString()
      }, {
        onConflict: 'clerkId'
      })
      .select()
      .single();

    if (userError) {
      console.error("User sync error:", userError);
      return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
    }

    // Resolve video and enforce access based on team membership or personal ownership
    const { data: video, error: videoError } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Access checks
    let allowed = false;
    if (video.teamId) {
      // Team-based: owner or member
      const { data: team } = await supabaseAdmin
        .from('teams')
        .select('ownerId')
        .eq('id', video.teamId)
        .single();
      allowed = team?.ownerId === user.id;
      if (!allowed) {
        const { data: membership } = await supabaseAdmin
          .from('team_members')
          .select('id')
          .eq('teamId', video.teamId)
          .eq('userId', user.id)
          .single();
        allowed = !!membership;
      }
    } else {
      // Personal video: only owner
      allowed = video.userId === user.id;
    }

    if (!allowed) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    // Owner is teamId if present, else userId
    const owner = video.teamId || video.userId;
    const key = `${owner}/videos/${videoId}/thumbnails/${safeName}`;

    // Generate presigned PUT URL
    const command = new PutObjectCommand({ 
      Bucket: process.env.S3_BUCKET!, 
      Key: key, 
      ContentType: contentType 
    });
    const putUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });

    return NextResponse.json({ putUrl, key });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("thumbnail presign error", e);
    return NextResponse.json({ error: "Failed to presign thumbnail", detail: err?.message }, { status: 500 });
  }
}
