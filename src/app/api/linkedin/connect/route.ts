export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { buildLinkedInAuthorizeUrl } from "@/lib/linkedin";

/**
 * GET /api/linkedin/connect
 * Redirect user to LinkedIn authorization screen.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clientId = process.env.LINKED_IN_CLIENT_ID;
    if (!clientId) {
      return NextResponse.redirect(new URL("/social?error=linkedin_missing_client_id", request.url));
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
    const redirectUri = process.env.LINKED_IN_REDIRECT_URI || `${origin}/api/linkedin/callback`;

    // LinkedIn uses space-separated scopes
    const scope = ["openid", "profile", "email", "w_member_social"].join(" ");

    const authorizeUrl = buildLinkedInAuthorizeUrl({
      clientId,
      redirectUri,
      scope,
      state,
    });

    const res = NextResponse.redirect(authorizeUrl);
    res.cookies.set("uplora_linkedin_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 10 * 60,
    });
    return res;
  } catch (e) {
    console.error("LinkedIn connect error:", e);
    return NextResponse.redirect(new URL("/social?error=linkedin_oauth_start_failed", request.url));
  }
}


