export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    console.log("YouTube OAuth callback received:", {
      hasCode: !!code,
      error,
      state
    });

    if (error) {
      console.error("YouTube OAuth error:", error);
      return NextResponse.redirect(new URL("/settings?error=youtube_connection_failed", request.url));
    }

    if (!code) {
      console.error("No authorization code received");
      return NextResponse.redirect(new URL("/settings?error=youtube_no_code", request.url));
    }

    // Use the correct base URL for redirect URI
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.uplora.io';
    const redirectUri = `${baseUrl}/api/youtube/connect`;

    console.log('YT_CONNECT_DIAGNOSTIC:', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret_set: !!process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      code_received: !!code,
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
      return NextResponse.redirect(new URL("/settings?error=youtube_token_failed", request.url));
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
      return NextResponse.redirect(new URL("/settings?error=youtube_channel_failed", request.url));
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
      return NextResponse.redirect(new URL("/settings?error=youtube_connection_failed", request.url));
    }

    console.log("YouTube connection successful!");
    return NextResponse.redirect(new URL("/settings?success=youtube_connected", request.url));
    
  } catch (error) {
    console.error("YouTube connection error:", error);
    return NextResponse.redirect(new URL("/settings?error=youtube_connection_failed", request.url));
  }
}
