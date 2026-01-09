export const runtime = "nodejs";

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { videoId } = await req.json();
  if (!videoId) return NextResponse.json({ error: "videoId required" }, { status: 400 });

  try {
    // For now, just mark as processed and create a mock web-optimized key
    const { data: video, error: videoError } = await supabaseAdmin
      .from('video_posts')
      .select('*')
      .eq('id', videoId)
      .eq('userId', userId)
      .single();
    
    if (videoError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Create a web-optimized key (same as original for now, but marked)
    const webOptimizedKey = video.key.replace('uploads/', 'web-optimized/');
    
    // Update web-optimized marker (without touching workflow status)
    const { error: updateError } = await supabaseAdmin
      .from('video_posts')
      .update({ 
        // Store web key in filename field temporarily
        filename: video.filename + ` [WEB:${webOptimizedKey}]`
      })
      .eq('id', videoId);
    
    if (updateError) {
      console.error("Failed to update video:", updateError);
      return NextResponse.json({ error: "Failed to update video" }, { status: 500 });
    }

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
