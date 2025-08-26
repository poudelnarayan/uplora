export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Clear YouTube connection data
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        youtubeAccessToken: null,
        youtubeRefreshToken: null,
        youtubeExpiresAt: null,
        youtubeChannelId: null,
        youtubeChannelTitle: null,
        updatedAt: new Date().toISOString()
      })
      .eq('clerkId', userId);
      
    if (updateError) {
      console.error("YouTube disconnect update error:", updateError);
      return NextResponse.json({ error: "Failed to disconnect YouTube account" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("YouTube disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect YouTube account" },
      { status: 500 }
    );
  }
}
