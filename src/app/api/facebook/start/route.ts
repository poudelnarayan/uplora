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
    
    // Define the scopes we need - using only public_profile which requires no app review
    const scope = "public_profile";
    
    // Determine redirect URI based on environment
    const reqOrigin = (() => { 
      try { 
        return new URL(request.url).origin; 
      } catch { 
        return 'http://localhost:3000'; 
      } 
    })();
    const isLocal = /localhost|127\.0\.0\.1/i.test(reqOrigin);
    const origin = isLocal ? reqOrigin : (process.env.NEXT_PUBLIC_SITE_URL || reqOrigin);
    const redirectUri = isLocal
      ? `${reqOrigin}/api/facebook/connect`
      : (process.env.META_REDIRECT_URI || `${origin}/api/facebook/connect`);
    
    // Build the Facebook OAuth URL
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${process.env.META_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}`;

    // Diagnostic logging
    console.log('FB_AUTH_DIAGNOSTIC:', {
      client_id: process.env.META_APP_ID,
      redirect_uri: redirectUri,
      scope: scope,
      baseUrl: origin,
      state: state,
      environment: process.env.NODE_ENV
    });

    console.log('FB_AUTH_URL:', authUrl);

    // Redirect to Facebook OAuth
    return NextResponse.redirect(authUrl);
    
  } catch (error) {
    console.error("Facebook OAuth start error:", error);
    return NextResponse.redirect(new URL("/social?error=facebook_oauth_start_failed", request.url));
  }
}
