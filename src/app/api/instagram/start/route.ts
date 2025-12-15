export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * Instagram Business Login - OAuth Start
 *
 * Step 1: Redirect the user to Instagram authorization screen with required scopes.
 * We generate a CSRF `state` value and store it in an HttpOnly cookie, then verify it on callback.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appId = process.env.IG_APP_ID;
    if (!appId) {
      return NextResponse.redirect(new URL("/social?error=instagram_missing_app_id", request.url));
    }

    // Step 1a) CSRF protection
    const state = crypto.randomUUID();

    // Step 1b) Determine redirect URI based on environment (must match the one registered in Meta/Instagram settings)
    const reqOrigin = (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return "http://localhost:3000";
      }
    })();
    const isLocal = /localhost|127\.0\.0\.1/i.test(reqOrigin);
    const origin = isLocal ? reqOrigin : (process.env.NEXT_PUBLIC_SITE_URL || reqOrigin);
    // If set, IG_REDIRECT_URI must EXACTLY match the whitelisted redirect URI in your Instagram app settings.
    // This avoids subtle mismatches (http vs https, trailing slash, different domain).
    const redirectUri = process.env.IG_REDIRECT_URI || `${origin}/api/instagram/callback`;

    // Step 1c) Build Instagram authorization URL
    // Scopes requested per requirements
    const scope = ["instagram_business_basic", "instagram_business_content_publish"].join(",");

    const authUrl = new URL("https://api.instagram.com/oauth/authorize");
    authUrl.searchParams.set("client_id", appId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("state", state);

    const res = NextResponse.redirect(authUrl.toString());
    res.cookies.set("uplora_ig_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 10 * 60, // 10 minutes
    });

    return res;
  } catch (error) {
    console.error("Instagram OAuth start error:", error);
    return NextResponse.redirect(new URL("/social?error=instagram_oauth_start_failed", request.url));
  }
}


