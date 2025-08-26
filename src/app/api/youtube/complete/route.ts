export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { broadcast } from "@/lib/realtime";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "No authorization code provided" }, { status: 400 });
    }

    // Use the YT_REDIRECT_URI environment variable
    const redirectUri = process.env.YT_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.uplora.io'}/api/youtube/connect`;

    console.log('YT_COMPLETE_DIAGNOSTIC:', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret_set: !!process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      code_received: !!code,
      userId: userId,
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    });

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", tokenData);
      return NextResponse.json({ error: "Token exchange failed" }, { status: 400 });
    }

    console.log("Token exchange successful, fetching channel info...");

    // Get YouTube channel info
    const channelResponse = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const channelData = await channelResponse.json();

    if (!channelResponse.ok) {
      console.error("Channel fetch failed:", channelData);
      return NextResponse.json({ error: "Channel fetch failed" }, { status: 400 });
    }

    console.log("Channel info retrieved:", {
      channelId: channelData.items?.[0]?.id,
      channelTitle: channelData.items?.[0]?.snippet?.title
    });

    // Store YouTube connection in database
    const { supabaseAdmin } = await import("@/lib/supabase");
    
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        youtubeAccessToken: tokenData.access_token,
        youtubeRefreshToken: tokenData.refresh_token,
        youtubeExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
        youtubeChannelId: channelData.items?.[0]?.id,
        youtubeChannelTitle: channelData.items?.[0]?.snippet?.title,
        updatedAt: new Date().toISOString()
      })
      .eq('clerkId', userId);
      
    if (updateError) {
      console.error("YouTube connection update error:", updateError);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }

    console.log("YouTube connection successful!");
    // Realtime notify this user so clients can refresh cached status
    try {
      broadcast({ type: "youtube.connected", userId });
    } catch {}
    return NextResponse.json({ 
      success: true, 
      channelTitle: channelData.items?.[0]?.snippet?.title 
    });
    
  } catch (error) {
    console.error("YouTube completion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
