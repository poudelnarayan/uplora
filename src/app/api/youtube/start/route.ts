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
    
    // Define the scopes we need
    const scope = "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly";
    
    // Use the correct base URL for redirect
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.uplora.io';
    const redirectUri = `${baseUrl}/api/youtube/connect`;
    
    // Build the Google OAuth URL
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${state}`;

    console.log("Starting YouTube OAuth flow:", {
      clientId: process.env.GOOGLE_CLIENT_ID,
      redirectUri,
      baseUrl,
      state
    });

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);
    
  } catch (error) {
    console.error("YouTube OAuth start error:", error);
    return NextResponse.redirect(new URL("/settings?error=youtube_oauth_start_failed", request.url));
  }
}
