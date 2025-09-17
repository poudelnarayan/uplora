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

    const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'];
    if (!supportedTypes.includes(contentType)) {
      return NextResponse.json({ error: "Only JPG, PNG, GIF, or BMP files are allowed for thumbnails" }, { status: 400 });
    }

    const safeName = String(filename).replace(/[^\w.\- ]+/g, "_");

    // Sync user
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    const userName = clerkUser.fullName || clerkUser.firstName || "";
    const userImage = clerkUser.imageUrl || "";

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
      return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
    }

    // Resolve video and teamId
    const { data: video, error: videoError } = await supabaseAdmin
      .from('video_posts')
      .select('id, teamId, userId')
      .eq('id', videoId)
      .single();
    if (videoError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const finalTeamId = video.teamId;
    if (!finalTeamId) {
      return NextResponse.json({ error: "Video must belong to a team (personal team included)" }, { status: 400 });
    }

    // Access check: owner or member
    const { data: team } = await supabaseAdmin
      .from('teams')
      .select('ownerId')
      .eq('id', finalTeamId)
      .single();
    let allowed = team?.ownerId === user.id;
    if (!allowed) {
      const { data: membership } = await supabaseAdmin
        .from('team_members')
        .select('id')
        .eq('teamId', finalTeamId)
        .eq('userId', user.id)
        .maybeSingle();
      allowed = !!membership;
    }
    if (!allowed) return NextResponse.json({ error: "Not a member of this team" }, { status: 403 });

    // Presign thumbnail under teams/<teamId>/videos/<videoId>/thumbnail
    const key = `teams/${finalTeamId}/videos/${videoId}/thumbnail`;

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
