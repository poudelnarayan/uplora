export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerkId', userId)
      .single();

    if (userError) {
      return NextResponse.json({
        error: "Database error",
        details: userError
      }, { status: 500 });
    }

    // Check YouTube connection status
    const youtubeData = {
      youtubeAccessToken: user?.youtubeAccessToken ? "SET" : "NOT_SET",
      youtubeChannelId: user?.youtubeChannelId || null,
      youtubeChannelTitle: user?.youtubeChannelTitle || null,
      youtubeExpiresAt: user?.youtubeExpiresAt || null,
      youtubeRefreshToken: user?.youtubeRefreshToken ? "SET" : "NOT_SET"
    };

    const isConnected = !!(user?.youtubeAccessToken && user?.youtubeChannelId);
    const isExpired = user?.youtubeExpiresAt && new Date() > new Date(user.youtubeExpiresAt);

    return NextResponse.json({
      userId,
      isConnected: isConnected && !isExpired,
      isExpired,
      youtubeData,
      allUserColumns: Object.keys(user || {}),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Debug YouTube status error:", error);
    return NextResponse.json({
      error: "Debug failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
