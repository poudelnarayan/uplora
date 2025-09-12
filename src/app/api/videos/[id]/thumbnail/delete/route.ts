export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { supabaseAdmin } from "@/lib/supabase";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });
    const { id } = context.params;

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

    // Get video and check access
    const { data: video, error: videoError } = await supabaseAdmin
      .from('video_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Check if user has access to this video
    let hasAccess = video.userId === user.id;
    if (!hasAccess && video.teamId) {
      // Check team membership
      const { data: membership, error: membershipError } = await supabaseAdmin
        .from('team_members')
        .select('*')
        .eq('teamId', video.teamId)
        .eq('userId', user.id)
        .single();
      hasAccess = !!membership;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete thumbnail from S3 if it exists
    if (video.thumbnailKey) {
      try {
        await s3.send(new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: video.thumbnailKey
        }));
      } catch (s3Error) {
        console.error("Failed to delete thumbnail from S3:", s3Error);
        // Continue anyway - we'll still update the database
      }
    }

    // Update video record to remove thumbnail reference
    await supabaseAdmin
      .from('video_posts')
      .update({ 
        thumbnailKey: null,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting thumbnail:", e);
    return NextResponse.json({ error: "Failed to delete thumbnail" }, { status: 500 });
  }
}
