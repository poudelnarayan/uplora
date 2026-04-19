export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getVideoById, updateVideoMetadata } from "@/lib/video-utils";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { videoId } = await req.json();
  if (!videoId) return NextResponse.json({ error: "videoId required" }, { status: 400 });

  try {
    const video = await getVideoById(videoId);
    if (!video || video.userId !== userId) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const webOptimizedKey = video.key ? video.key.replace('uploads/', 'web-optimized/') : null;

    await updateVideoMetadata(videoId, { web_optimized_key: webOptimizedKey });

    return NextResponse.json({
      success: true,
      originalKey: video.key,
      webOptimizedKey,
    });
  } catch (error) {
    console.error("Video processing error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
