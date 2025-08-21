import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await context.params;
    
    // Find the video and verify ownership
    const video = await prisma.video.findFirst({
      where: { 
        id,
        user: { email: session.user.email }
      }
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found or access denied" }, { status: 404 });
    }

    if (!video.thumbnailKey) {
      return NextResponse.json({ error: "No thumbnail to delete" }, { status: 400 });
    }

    // Delete thumbnail from S3
    try {
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: video.thumbnailKey
      }));
    } catch (s3Error) {
      // Log but continue - we still want to clear the database reference
      console.error("Failed to delete thumbnail from S3:", s3Error);
    }

    // Clear thumbnailKey from database
    await prisma.video.update({
      where: { id },
      data: { thumbnailKey: null }
    });

    return NextResponse.json({ success: true, message: "Thumbnail deleted successfully" });
  } catch (error) {
    console.error("Delete thumbnail error:", error);
    return NextResponse.json({ error: "Failed to delete thumbnail" }, { status: 500 });
  }
}
