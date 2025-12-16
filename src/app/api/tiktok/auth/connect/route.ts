export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { buildTikTokAuthorizeUrl } from "@/lib/tiktok";

/**
 * GET /api/tiktok/auth/connect
 *
 * Step 1: Redirect the user to TikTok OAuth authorize URL.
 * Includes: client_key, redirect_uri, response_type=code, scope, and state.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    if (!clientKey) {
      return NextResponse.redirect(new URL("/social?error=tiktok_missing_client_key", request.url));
    }

    // CSRF state (validated on callback)
    const state = crypto.randomUUID();

    // Redirect URI must match what is configured in TikTok Developer Console
    const reqOrigin = (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return "http://localhost:3000";
      }
    })();
    // Use the current request origin so the redirect_uri matches the domain the user is on
    // (important when both uplora.io and www.uplora.io are configured in TikTok console).
    const origin = reqOrigin.replace(/\/+$/g, "");
    const redirectUri = process.env.TIKTOK_REDIRECT_URI || `${origin}/api/tiktok/auth/callback`;

    const scope = ["user.info.basic", "video.upload"].join(",");

    const authorizeUrl = buildTikTokAuthorizeUrl({
      clientKey,
      redirectUri,
      scope,
      state,
    });

    const res = NextResponse.redirect(authorizeUrl);
    res.cookies.set("uplora_tiktok_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 10 * 60, // 10 minutes
    });
    return res;
  } catch (e) {
    console.error("TikTok OAuth connect error:", e);
    return NextResponse.redirect(new URL("/social?error=tiktok_oauth_start_failed", request.url));
  }
}


