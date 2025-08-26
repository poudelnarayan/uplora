export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabase";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { broadcast } from "@/lib/realtime";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = context.params;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Find the video and check access
    const video = await prisma.video.findFirst({
      where: { id },
      select: {
        id: true,
        key: true,
        thumbnailKey: true,
        userId: true,
        teamId: true,
      }
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Check access: team OWNER or team ADMIN/MANAGER
    // Editors and personal uploaders cannot delete (server-enforced)
    let hasDeleteAccess = false;
    if (video.teamId) {
      // Team owner can delete
      const team = await prisma.team.findUnique({ where: { id: video.teamId }, select: { ownerId: true } });
      if (team?.ownerId === user.id) {
        hasDeleteAccess = true;
      } else {
        // Admin/Manager can delete
        const membership = await prisma.teamMember.findFirst({
          where: { teamId: video.teamId, userId: user.id },
          select: { role: true },
        });
        hasDeleteAccess = !!membership && ['ADMIN', 'MANAGER'].includes(membership.role as string);
      }
    } else {
      // Personal workspace: only the account owner (uploader) can delete
      hasDeleteAccess = video.userId === user.id;
    }
    
    if (!hasDeleteAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete from S3 (both video and thumbnail)
    try {
      // Delete the video file
      console.log(`Deleting video from S3: ${video.key}`);
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: video.key
      }));

      // Delete the thumbnail if it exists
      if (video.thumbnailKey) {
        console.log(`Deleting thumbnail from S3: ${video.thumbnailKey}`);
        await s3.send(new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: video.thumbnailKey
        }));
        console.log(`Successfully deleted thumbnail: ${video.thumbnailKey}`);
      } else {
        console.log('No thumbnail to delete (thumbnailKey is null)');
      }
    } catch (s3Error) {
      // Log but don't fail if S3 deletion fails
      console.error("Failed to delete from S3:", s3Error);
    }

    // Delete from database
    await prisma.video.delete({
      where: { id }
    });

    // Broadcast deletion event
    broadcast({ 
      type: "video.deleted", 
      teamId: video.teamId || null, 
      payload: { id: video.id, teamId: video.teamId }
    });

    return NextResponse.json({ success: true, message: "Video deleted successfully" });
  } catch (error) {
    console.error("Delete video error:", error);
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
  }
}
