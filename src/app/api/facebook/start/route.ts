export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // CSRF state - persisted in an HttpOnly cookie and validated on callback.
    const state = crypto.randomUUID();

    // Scopes needed for Page posting + Instagram publishing via IG Graph API.
    // Note: Additional permissions may be required depending on your app mode / review status.
    const scope = [
      "pages_show_list",
      "pages_manage_posts",
      "instagram_basic",
      "instagram_content_publish",
    ].join(",");

    const apiVersion = process.env.META_API_VERSION || "v19.0";
    
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
    const authUrl = `https://www.facebook.com/${apiVersion}/dialog/oauth?` +
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
    const res = NextResponse.redirect(authUrl);
    res.cookies.set("uplora_fb_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 10 * 60, // 10 minutes
    });
    return res;
    
  } catch (error) {
    console.error("Facebook OAuth start error:", error);
    return NextResponse.redirect(new URL("/social?error=facebook_oauth_start_failed", request.url));
  }
}
