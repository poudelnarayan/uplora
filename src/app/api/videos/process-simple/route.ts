export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { videoId } = await req.json();
  if (!videoId) return NextResponse.json({ error: "videoId required" }, { status: 400 });

  try {
    // For now, just mark as processed and create a mock web-optimized key
    const video = await prisma.video.findFirst({
      where: { id: videoId, user: { email: session.user.email } }
    });
    
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    // Create a web-optimized key (same as original for now, but marked)
    const webOptimizedKey = video.key.replace('uploads/', 'web-optimized/');
    
    // Update with processing complete
    await prisma.video.update({
      where: { id: videoId },
      data: { 
        status: "PROCESSING",
        // Store web key in filename field temporarily
        filename: video.filename + ` [WEB:${webOptimizedKey}]`
      }
    });

    return NextResponse.json({ 
      success: true, 
      originalKey: video.key,
      webOptimizedKey: webOptimizedKey
    });

  } catch (error) {
    console.error("Video processing error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
