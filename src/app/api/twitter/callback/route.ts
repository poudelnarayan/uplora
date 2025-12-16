export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { exchangeXCodeForTokens, fetchXMe } from "@/lib/twitter";
import { updateUserSocialConnections } from "@/server/services/socialConnections";

/**
 * GET /api/twitter/callback
 *
 * 1) Validate state + PKCE code_verifier
 * 2) Exchange code -> access_token + refresh_token
 * 3) Fetch X user profile
 * 4) Persist encrypted tokens + expiry to socialConnections.twitter
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    if (error) {
      console.error("X OAuth denied:", { error, errorDescription });
      return NextResponse.redirect(new URL("/social?error=x_oauth_denied", request.url));
    }
    if (!code) return NextResponse.redirect(new URL("/social?error=x_no_code", request.url));

    const expectedState = request.cookies.get("uplora_x_oauth_state")?.value;
    const codeVerifier = request.cookies.get("uplora_x_pkce_verifier")?.value;
    if (!state || !expectedState || state !== expectedState) {
      return NextResponse.redirect(new URL("/social?error=x_state_mismatch", request.url));
    }
    if (!codeVerifier) {
      return NextResponse.redirect(new URL("/social?error=x_missing_pkce_verifier", request.url));
    }

    const { userId } = await auth();
    if (!userId) return NextResponse.redirect(new URL("/sign-in?redirect_url=/social", request.url));

    const clientId = process.env.X_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL("/social?error=x_missing_client_config", request.url));
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
    const redirectUri = process.env.X_REDIRECT_URI || `${origin}/api/twitter/callback`;

    let token;
    try {
      token = await exchangeXCodeForTokens({
        code,
        codeVerifier,
        clientId,
        clientSecret,
        redirectUri,
      });
    } catch (e: any) {
      console.error("X token exchange failure:", e);
      const msg = typeof e?.message === "string" ? e.message : "";
      if (msg.includes("TOKEN_ENCRYPTION_KEY")) {
        return NextResponse.redirect(new URL("/social?error=x_missing_encryption_key", request.url));
      }
      return NextResponse.redirect(new URL("/social?error=x_token_failed", request.url));
    }

    let me;
    try {
      me = await fetchXMe(token.encryptedAccessToken);
    } catch (e) {
      console.error("X user fetch failure:", e);
      // still store tokens; user fetch can be retried later
      me = null;
    }

    const connectedAt = new Date().toISOString();
    try {
      await updateUserSocialConnections(userId, current => ({
        ...current,
        twitter: {
          ...(current.twitter || {}),
          connectedAt,
          encryptedAccessToken: token.encryptedAccessToken,
          encryptedRefreshToken: token.encryptedRefreshToken || undefined,
          tokenExpiresAt: token.tokenExpiresAt,
          scope: token.scope ?? "tweet.read tweet.write users.read offline.access",
          userId: me?.userId ?? null,
          username: me?.username ?? null,
          name: me?.name ?? null,
          profileImageUrl: me?.profileImageUrl ?? null,
        },
      }));
    } catch (e) {
      console.error("X save failure:", e);
      return NextResponse.redirect(new URL("/social?error=x_save_failed", request.url));
    }

    const res = NextResponse.redirect(new URL("/social?success=x_connected", request.url));
    res.cookies.set("uplora_x_oauth_state", "", { path: "/", maxAge: 0 });
    res.cookies.set("uplora_x_pkce_verifier", "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    console.error("X callback error:", e);
    return NextResponse.redirect(new URL("/social?error=x_callback_failed", request.url));
  }
}


