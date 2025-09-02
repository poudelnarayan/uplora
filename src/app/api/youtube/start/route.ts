export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate a random state for security
    const state = Math.random().toString(36).substring(7);
    
    // Define the scopes we need - both upload and readonly for channel info
    const scope = "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly";
    
    // Prefer explicit env; otherwise infer from current request (works on localhost)
    const reqOrigin = (() => { try { return new URL(request.url).origin; } catch { return 'http://localhost:3000'; } })();
    const isLocal = /localhost|127\.0\.0\.1/i.test(reqOrigin);
    const origin = isLocal ? reqOrigin : (process.env.NEXT_PUBLIC_SITE_URL || reqOrigin);
    const redirectUri = isLocal
      ? `${reqOrigin}/api/youtube/connect`
      : (process.env.YT_REDIRECT_URI || `${origin}/api/youtube/connect`);
    
    // Build the Google OAuth URL
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${state}`;

    // Diagnostic logging for production debugging
    console.log('YT_AUTH_DIAGNOSTIC:', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: scope,
      baseUrl: origin,
      state: state,
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    });

    // Log the full auth URL for debugging
    console.log('YT_AUTH_URL:', authUrl);

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);
    
  } catch (error) {
    console.error("YouTube OAuth start error:", error);
    return NextResponse.redirect(new URL("/social?error=youtube_oauth_start_failed", request.url));
  }
}
