export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Instagram Business Login - OAuth Callback
 *
 * Steps:
 * 1) Validate `state` (CSRF)
 * 2) Exchange authorization code -> short-lived access token
 * 3) Exchange short-lived -> long-lived token (best-effort; used for longer sessions)
 * 4) Fetch Instagram Business Account identifier (best-effort)
 * 5) Persist: instagram_user_id, access_token, token_expiry
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const oauthError = url.searchParams.get("error");
    const oauthErrorReason = url.searchParams.get("error_reason");
    const oauthErrorDescription = url.searchParams.get("error_description");

    // Step 0) Handle OAuth errors
    if (oauthError) {
      console.error("Instagram OAuth error:", { oauthError, oauthErrorReason, oauthErrorDescription });
      return NextResponse.redirect(
        new URL(
          `/social?error=instagram_oauth_denied&reason=${encodeURIComponent(oauthErrorReason || "")}`,
          request.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(new URL("/social?error=instagram_no_code", request.url));
    }

    // Step 1) Validate CSRF state
    const expectedState = request.cookies.get("uplora_ig_oauth_state")?.value;
    if (!state || !expectedState || state !== expectedState) {
      return NextResponse.redirect(new URL("/social?error=instagram_state_mismatch", request.url));
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in?redirect_url=/social", request.url));
    }

    const appId = process.env.IG_APP_ID;
    const appSecret = process.env.IG_APP_SECRET;
    if (!appId || !appSecret) {
      return NextResponse.redirect(new URL("/social?error=instagram_missing_app_config", request.url));
    }

    // Step 2) Determine redirect URI (must match authorization request)
    const reqOrigin = (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return "http://localhost:3000";
      }
    })();
    const isLocal = /localhost|127\.0\.0\.1/i.test(reqOrigin);
    const origin = isLocal ? reqOrigin : (process.env.NEXT_PUBLIC_SITE_URL || reqOrigin);
    // Must match the redirect_uri used during authorization (and what is whitelisted in app settings).
    const redirectUri = process.env.IG_REDIRECT_URI || `${origin}/api/instagram/callback`;

    // Step 3) Exchange code -> short-lived access token
    // POST https://api.instagram.com/oauth/access_token
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    });

    const tokenJson: any = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson?.access_token || !tokenJson?.user_id) {
      console.error("Instagram token exchange failed:", tokenJson);
      return NextResponse.redirect(new URL("/social?error=instagram_token_failed", request.url));
    }

    const shortLivedAccessToken = tokenJson.access_token as string;
    const instagramUserId = String(tokenJson.user_id);

    // Step 4) Exchange short-lived -> long-lived token (best-effort)
    // GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=...&access_token=...
    let accessToken = shortLivedAccessToken;
    let tokenExpiresAt: string | null = null;

    try {
      const exchangeUrl = new URL("https://graph.instagram.com/access_token");
      exchangeUrl.searchParams.set("grant_type", "ig_exchange_token");
      exchangeUrl.searchParams.set("client_secret", appSecret);
      exchangeUrl.searchParams.set("access_token", shortLivedAccessToken);

      const exchangeRes = await fetch(exchangeUrl.toString(), { method: "GET" });
      const exchangeJson: any = await exchangeRes.json();
      if (exchangeRes.ok && exchangeJson?.access_token) {
        accessToken = exchangeJson.access_token as string;
        if (typeof exchangeJson?.expires_in === "number") {
          tokenExpiresAt = new Date(Date.now() + exchangeJson.expires_in * 1000).toISOString();
        }
      }
    } catch (e) {
      // Non-fatal; we can proceed with short-lived token but it may expire quickly.
      console.warn("Instagram long-lived token exchange skipped:", e);
    }

    // Step 5) Fetch Instagram Business Account ID (best-effort).
    // Many flows treat `instagramUserId` as the IG account identifier for publishing.
    // If Graph endpoint returns an id, we store it as `businessAccountId` for convenience/compat.
    let businessAccountId: string | null = null;
    try {
      const meUrl = new URL("https://graph.instagram.com/me");
      meUrl.searchParams.set("fields", "id,username,account_type");
      meUrl.searchParams.set("access_token", accessToken);
      const meRes = await fetch(meUrl.toString(), { method: "GET" });
      const meJson: any = await meRes.json();
      if (meRes.ok && meJson?.id) {
        businessAccountId = String(meJson.id);
      } else {
        businessAccountId = instagramUserId;
      }
    } catch {
      businessAccountId = instagramUserId;
    }

    // Step 6) Persist to Supabase `users.socialConnections.instagram`
    const connectedAt = new Date().toISOString();
    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("socialConnections")
      .eq("id", userId)
      .single();

    const socialConnections = {
      ...(currentUser?.socialConnections || {}),
      instagram: {
        connectedAt,
        instagramUserId,
        businessAccountId,
        accessToken,
        tokenExpiresAt,
      },
    };

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        socialConnections,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Failed to save Instagram connection:", updateError);
      return NextResponse.redirect(new URL("/social?error=instagram_save_failed", request.url));
    }

    // Step 7) Clear CSRF cookie and redirect
    const res = NextResponse.redirect(new URL("/social?success=instagram_connected", request.url));
    res.cookies.set("uplora_ig_oauth_state", "", { path: "/", maxAge: 0 });
    return res;
  } catch (error) {
    console.error("Instagram OAuth callback error:", error);
    return NextResponse.redirect(new URL("/social?error=instagram_callback_failed", request.url));
  }
}


