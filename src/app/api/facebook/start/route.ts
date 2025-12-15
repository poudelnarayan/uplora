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
    const intentParam = (searchParams.get("intent") || "facebook").toLowerCase();
    const intent: "facebook" | "instagram" = intentParam === "instagram" ? "instagram" : "facebook";

    // CSRF state - persisted in an HttpOnly cookie and validated on callback.
    const state = crypto.randomUUID();

    // Meta (Facebook Login) scopes.
    // - For Facebook publishing: page list + manage posts.
    // - For Instagram publishing (via IG business account on a Page): need additional instagram_* scopes.
    const scopes =
      intent === "instagram"
        ? [
            "pages_show_list",
            "pages_read_engagement",
            "pages_manage_posts",
            "instagram_basic",
            "instagram_content_publish",
          ]
        : ["pages_show_list", "pages_manage_posts"];

    const scope = scopes.join(",");

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
    res.cookies.set("uplora_meta_oauth_intent", intent, {
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
