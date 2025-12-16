export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { buildPinterestAuthorizeUrl } from "@/lib/pinterest";

/**
 * GET /api/pinterest/auth/connect
 *
 * Step 1: Redirect the user to Pinterest OAuth authorization URL.
 * Includes client_id, redirect_uri, response_type=code, requested scopes, and state.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clientId =
      process.env.PINTEREST_APP_ID ||
      process.env.PINTEREST_CLIENT_ID ||
      process.env.PINTEREST_CLIENT_KEY;
    if (!clientId) {
      return NextResponse.redirect(new URL("/social?error=pinterest_missing_app_id", request.url));
    }

    const state = crypto.randomUUID();

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

    const scope = ["boards:read", "pins:read", "pins:write"].join(",");

    const authorizeUrl = buildPinterestAuthorizeUrl({
      clientId,
      redirectUri,
      scope,
      state,
    });

    const res = NextResponse.redirect(authorizeUrl);
    res.cookies.set("uplora_pinterest_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 10 * 60,
    });
    return res;
  } catch (e) {
    console.error("Pinterest OAuth connect error:", e);
    return NextResponse.redirect(new URL("/social?error=pinterest_oauth_start_failed", request.url));
  }
}


