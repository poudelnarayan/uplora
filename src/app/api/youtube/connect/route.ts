export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
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
      return NextResponse.redirect(new URL("/social?error=youtube_connection_failed", request.url));
    }

    if (!code) {
      console.error("No authorization code received");
      return NextResponse.redirect(new URL("/social?error=youtube_no_code", request.url));
    }

    // For OAuth callbacks, we need to handle the code exchange without requiring authentication
    // We'll store the code temporarily and redirect to a completion page
    const { userId } = await auth();
    
    if (!userId) {
      // If no user is authenticated, redirect to sign in with the code
      return NextResponse.redirect(new URL(`/sign-in?redirect_url=${encodeURIComponent(`/social?youtube_code=${code}`)}`, request.url));
    }

    // Prefer explicit env; otherwise infer from current request (works on localhost)
    const reqOrigin = (() => { try { return new URL(request.url).origin; } catch { return 'http://localhost:3000'; } })();
    const isLocal = /localhost|127\.0\.0\.1/i.test(reqOrigin);
    const origin = isLocal ? reqOrigin : (process.env.NEXT_PUBLIC_SITE_URL || reqOrigin);
    const redirectUri = isLocal
      ? `${reqOrigin}/api/youtube/connect`
      : (process.env.YT_REDIRECT_URI || `${origin}/api/youtube/connect`);

    console.log('YT_CONNECT_DIAGNOSTIC:', {
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
      return NextResponse.redirect(new URL("/social?error=youtube_token_failed", request.url));
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
      return NextResponse.redirect(new URL("/social?error=youtube_channel_failed", request.url));
    }

    console.log("Channel info retrieved:", {
      channelId: channelData.items?.[0]?.id,
      channelTitle: channelData.items?.[0]?.snippet?.title
    });

    // Store YouTube connection in database
    const { updateUserSocialConnections } = await import("@/server/services/socialConnections");
    try {
      const connectedAt = new Date().toISOString();
      const tokenExpiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;

      const channelId = channelData.items?.[0]?.id ?? null;
      const channelTitle = channelData.items?.[0]?.snippet?.title ?? null;

      await updateUserSocialConnections(userId, current => ({
        ...current,
        youtube: {
          ...(current.youtube || {}),
          connectedAt,
          accessToken: tokenData.access_token,
          // refresh_token may not be returned on every consent; keep existing if missing
          refreshToken: tokenData.refresh_token || current.youtube?.refreshToken,
          tokenExpiresAt,
          scope: tokenData.scope || current.youtube?.scope || null,
          channelId,
          channelTitle,
        },
      }));
    } catch (updateError) {
      console.error("YouTube connection update error:", updateError);
      return NextResponse.redirect(new URL("/social?error=youtube_connection_failed", request.url));
    }

    console.log("YouTube connection successful!");
    return NextResponse.redirect(new URL("/social?success=youtube_connected", request.url));
    
  } catch (error) {
    console.error("YouTube connection error:", error);
    return NextResponse.redirect(new URL("/social?error=youtube_connection_failed", request.url));
  }
}
