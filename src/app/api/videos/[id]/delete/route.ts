export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";

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
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Check access: owner or team member (team owner included)
    let hasAccess = video.userId === user.id; // Uploader (personal owner)
    if (!hasAccess && video.teamId) {
      // Team owner has access
      const { data: team, error: teamError } = await supabaseAdmin
        .from('teams')
        .select('ownerId')
        .eq('id', video.teamId)
        .single();

      if (team?.ownerId === user.id) {
        hasAccess = true;
      } else {
        // Check if user is a member of the video's team
        const { data: membership, error: membershipError } = await supabaseAdmin
          .from('team_members')
          .select('*')
          .eq('teamId', video.teamId)
          .eq('userId', user.id)
          .single();
        hasAccess = !!membership;
      }
    }
    
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete video file from S3
    try {
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: video.key
      }));
    } catch (s3Error) {
      console.error("Failed to delete video from S3:", s3Error);
      // Continue anyway - we'll still delete the database record
    }

    // Delete thumbnail if it exists
    if (video.thumbnailKey) {
      try {
        await s3.send(new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: video.thumbnailKey
        }));
      } catch (s3Error) {
        console.error("Failed to delete thumbnail from S3:", s3Error);
        // Continue anyway
      }
    }

    // Delete video record from database
    await supabaseAdmin
      .from('videos')
      .delete()
      .eq('id', id);

    // Broadcast deletion event
    broadcast({ 
      type: "video.deleted", 
      teamId: video.teamId || null, 
      payload: { id: video.id }
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting video:", e);
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
  }
}
