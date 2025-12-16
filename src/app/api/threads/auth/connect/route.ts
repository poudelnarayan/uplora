export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { buildThreadsAuthorizeUrl } from "@/lib/threads";

/**
 * GET /api/threads/auth/connect
 *
 * Redirect the user to Threads OAuth authorize URL (direct Threads, no Instagram/Facebook).
 *
 * Exact format (per requirement):
 * https://www.threads.com/oauth/authorize
 *   ?client_id=YOUR_META_APP_ID
 *   &redirect_uri=https://uplora.io/api/threads-auth/callback
 *   &response_type=code
 *   &scope=threads_basic,threads_content_publish
 *   &state=SECURE_RANDOM
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clientId = process.env.THREADS_APP_ID || process.env.META_APP_ID;
    if (!clientId) return NextResponse.redirect(new URL("/social?error=threads_missing_app_id", request.url));

    const state = crypto.randomUUID();

    // Must match the whitelisted redirect URI in Meta app settings.
    const reqOrigin = (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return "http://localhost:3000";
      }
    })();
    const originRaw = process.env.NEXT_PUBLIC_SITE_URL || reqOrigin;
    const origin = originRaw.replace(/\/+$/g, "");
    const redirectUri = process.env.THREADS_REDIRECT_URI || `${origin}/api/threads-auth/callback`;

    const scope = ["threads_basic", "threads_content_publish"].join(",");

    const authorizeUrl = buildThreadsAuthorizeUrl({
      clientId,
      redirectUri,
      scope,
      state,
    });

    const res = NextResponse.redirect(authorizeUrl);
    res.cookies.set("uplora_threads_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 10 * 60,
    });
    return res;
  } catch (e) {
    console.error("Threads OAuth connect error:", e);
    return NextResponse.redirect(new URL("/social?error=threads_oauth_start_failed", request.url));
  }
}


