import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/settings?error=youtube_connection_failed", request.url));
  }

  if (!code) {
    // Start OAuth flow
    const state = Math.random().toString(36).substring(7);
    const scope = "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly";
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/youtube/connect`;
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${state}`;

    return NextResponse.redirect(authUrl);
  }

  try {
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
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/youtube/connect`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", tokenData);
      return NextResponse.redirect(new URL("/settings?error=youtube_token_failed", request.url));
    }

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

    // Store YouTube connection in database
    const { prisma } = await import("@/lib/prisma");
    
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        youtubeAccessToken: tokenData.access_token,
        youtubeRefreshToken: tokenData.refresh_token,
        youtubeExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
        youtubeChannelId: channelData.items?.[0]?.id,
        youtubeChannelTitle: channelData.items?.[0]?.snippet?.title,
      },
    });

    return NextResponse.redirect(new URL("/settings?success=youtube_connected", request.url));
  } catch (error) {
    console.error("YouTube connection error:", error);
    return NextResponse.redirect(new URL("/settings?error=youtube_connection_failed", request.url));
  }
}
