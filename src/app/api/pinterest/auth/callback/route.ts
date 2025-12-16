export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { exchangePinterestCodeForTokens, getPinterestUser } from "@/lib/pinterest";
import { updateUserSocialConnections } from "@/server/services/socialConnections";

/**
 * GET /api/pinterest/auth/callback
 *
 * Steps:
 * 1) Validate state (CSRF)
 * 2) Exchange authorization code -> access_token + refresh_token
 * 3) Fetch basic Pinterest user profile
 * 4) Persist tokens + profile in socialConnections.pinterest
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    if (error) {
      console.error("Pinterest OAuth denied:", { error, errorDescription });
      return NextResponse.redirect(new URL("/social?error=pinterest_oauth_denied", request.url));
    }

    if (!code) return NextResponse.redirect(new URL("/social?error=pinterest_no_code", request.url));

    const expectedState = request.cookies.get("uplora_pinterest_oauth_state")?.value;
    if (!state || !expectedState || state !== expectedState) {
      return NextResponse.redirect(new URL("/social?error=pinterest_state_mismatch", request.url));
    }

    const { userId } = await auth();
    if (!userId) return NextResponse.redirect(new URL("/sign-in?redirect_url=/social", request.url));

    const clientId =
      process.env.PINTEREST_APP_ID ||
      process.env.PINTEREST_CLIENT_ID ||
      process.env.PINTEREST_CLIENT_KEY;
    const clientSecret = process.env.PINTEREST_SECRET_KEY || process.env.PINTEREST_APP_SECRET;
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL("/social?error=pinterest_missing_app_config", request.url));
    }

    const reqOrigin = (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return "http://localhost:3000";
      }
    })();
    const originRaw = process.env.NEXT_PUBLIC_SITE_URL || reqOrigin;
    const origin = originRaw.replace(/\/+$/g, "");
    const redirectUri = process.env.PINTEREST_REDIRECT_URI || `${origin}/api/pinterest/auth/callback`;

    let token;
    try {
      token = await exchangePinterestCodeForTokens({
        code,
        clientId,
        clientSecret,
        redirectUri,
      });
    } catch (e) {
      console.error("Pinterest token exchange failure:", e);
      return NextResponse.redirect(new URL("/social?error=pinterest_token_failed", request.url));
    }

    // Fetch user profile (best-effort)
    let profile: any = null;
    try {
      profile = await getPinterestUser(token.accessToken);
    } catch (e) {
      console.error("Pinterest user fetch failure:", e);
    }

    const connectedAt = new Date().toISOString();
    try {
      await updateUserSocialConnections(userId, current => ({
        ...current,
        pinterest: {
          ...(current.pinterest || {}),
          connectedAt,
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          tokenExpiresAt: token.tokenExpiresAt,
          refreshTokenExpiresAt: token.refreshTokenExpiresAt,
          scope: token.scope ?? "boards:read,pins:read,pins:write",
          username: profile?.username ?? null,
          profileImage: profile?.profile_image ?? null,
          accountType: profile?.account_type ?? null,
        },
      }));
    } catch (e) {
      console.error("Pinterest save failure:", e);
      return NextResponse.redirect(new URL("/social?error=pinterest_save_failed", request.url));
    }

    const res = NextResponse.redirect(new URL("/social?success=pinterest_connected", request.url));
    res.cookies.set("uplora_pinterest_oauth_state", "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    console.error("Pinterest callback error:", e);
    return NextResponse.redirect(new URL("/social?error=pinterest_callback_failed", request.url));
  }
}


