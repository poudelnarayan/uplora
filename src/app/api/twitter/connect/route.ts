export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { buildXAuthorizeUrl, generatePkcePair } from "@/lib/twitter";

/**
 * GET /api/twitter/connect
 *
 * Starts X OAuth2 flow using PKCE.
 * Redirects user to X authorization endpoint with required scopes.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clientId = process.env.X_CLIENT_ID;
    if (!clientId) return NextResponse.redirect(new URL("/social?error=x_missing_client_id", request.url));

    const state = crypto.randomUUID();
    const { codeVerifier, codeChallenge } = generatePkcePair();

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

    const scope = ["tweet.read", "tweet.write", "users.read", "offline.access"].join(" ");

    const authorizeUrl = buildXAuthorizeUrl({
      clientId,
      redirectUri,
      state,
      codeChallenge,
      scope,
    });

    const res = NextResponse.redirect(authorizeUrl);
    res.cookies.set("uplora_x_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 10 * 60,
    });
    res.cookies.set("uplora_x_pkce_verifier", codeVerifier, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 10 * 60,
    });
    return res;
  } catch (e) {
    console.error("X connect error:", e);
    return NextResponse.redirect(new URL("/social?error=x_oauth_start_failed", request.url));
  }
}


