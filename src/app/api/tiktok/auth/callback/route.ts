export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { exchangeTikTokCodeForTokens, fetchTikTokUserInfo } from "@/lib/tiktok";
import { updateUserSocialConnections } from "@/server/services/socialConnections";

/**
 * GET /api/tiktok/auth/callback
 *
 * Steps:
 * 1) Validate state (CSRF)
 * 2) Exchange code for access_token + refresh_token
 * 3) Fetch basic user info
 * 4) Store tokens and user profile
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    if (error) {
      console.error("TikTok OAuth error:", { error, errorDescription });
      return NextResponse.redirect(new URL(`/social?error=tiktok_oauth_denied`, request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL("/social?error=tiktok_no_code", request.url));
    }

    const expectedState = request.cookies.get("uplora_tiktok_oauth_state")?.value;
    if (!state || !expectedState || state !== expectedState) {
      return NextResponse.redirect(new URL("/social?error=tiktok_state_mismatch", request.url));
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in?redirect_url=/social", request.url));
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    if (!clientKey || !clientSecret) {
      return NextResponse.redirect(new URL("/social?error=tiktok_missing_client_config", request.url));
    }

    const reqOrigin = (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return "http://localhost:3000";
      }
    })();
    // Use the current request origin so it matches the redirect_uri used in /auth/connect.
    const origin = reqOrigin.replace(/\/+$/g, "");
    const redirectUri = process.env.TIKTOK_REDIRECT_URI || `${origin}/api/tiktok/auth/callback`;

    // 2) Exchange code -> tokens
    let tokenData;
    try {
      tokenData = await exchangeTikTokCodeForTokens({
        code,
        clientKey,
        clientSecret,
        redirectUri,
      });
    } catch (e) {
      console.error("TikTok token exchange failure:", e);
      // Common causes:
      // - redirect_uri mismatch (uplora.io vs www.uplora.io)
      // - missing TIKTOK_CLIENT_SECRET in production env
      return NextResponse.redirect(new URL("/social?error=tiktok_token_failed", request.url));
    }

    // 3) Fetch user info
    let profile;
    try {
      profile = await fetchTikTokUserInfo(tokenData.accessToken);
    } catch (e) {
      console.error("TikTok user info failure:", e);
      profile = {};
    }

    // 4) Persist
    const connectedAt = new Date().toISOString();
    try {
      await updateUserSocialConnections(userId, current => ({
        ...current,
        tiktok: {
          ...(current.tiktok || {}),
          connectedAt,
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          tokenExpiresAt: tokenData.tokenExpiresAt,
          refreshTokenExpiresAt: tokenData.refreshTokenExpiresAt,
          openId: profile.openId || tokenData.openId,
          unionId: profile.unionId,
          username: profile.username ?? null,
          displayName: profile.displayName ?? null,
          avatarUrl: profile.avatarUrl ?? null,
          scope: tokenData.scope ?? null,
        },
      }));
    } catch (e) {
      console.error("TikTok save failure:", e);
      return NextResponse.redirect(new URL("/social?error=tiktok_save_failed", request.url));
    }

    const res = NextResponse.redirect(new URL("/social?success=tiktok_connected", request.url));
    res.cookies.set("uplora_tiktok_oauth_state", "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    console.error("TikTok callback error:", e);
    return NextResponse.redirect(new URL("/social?error=tiktok_callback_failed", request.url));
  }
}


