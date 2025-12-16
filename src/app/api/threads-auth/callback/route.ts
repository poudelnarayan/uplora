export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { exchangeThreadsCodeForToken } from "@/lib/threads";
import { updateUserSocialConnections } from "@/server/services/socialConnections";

/**
 * GET /api/threads-auth/callback
 *
 * 1) Validate `state`
 * 2) Exchange `code` -> access_token via https://graph.threads.net/oauth/access_token
 * 3) Persist threads user + token
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    if (error) {
      console.error("Threads OAuth error:", { error, errorDescription });
      return NextResponse.redirect(new URL("/social?error=threads_oauth_denied", request.url));
    }
    if (!code) return NextResponse.redirect(new URL("/social?error=threads_no_code", request.url));

    const expectedState = request.cookies.get("uplora_threads_oauth_state")?.value;
    if (!state || !expectedState || state !== expectedState) {
      return NextResponse.redirect(new URL("/social?error=threads_state_mismatch", request.url));
    }

    const { userId } = await auth();
    if (!userId) return NextResponse.redirect(new URL("/sign-in?redirect_url=/social", request.url));

    const clientId = process.env.THREADS_APP_ID || process.env.META_APP_ID;
    const clientSecret = process.env.THREADS_APP_SECRET || process.env.META_APP_SECRET;
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL("/social?error=threads_missing_app_config", request.url));
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
    const redirectUri = process.env.THREADS_REDIRECT_URI || `${origin}/api/threads-auth/callback`;

    let token;
    try {
      token = await exchangeThreadsCodeForToken({
        clientId,
        clientSecret,
        code,
        redirectUri,
      });
    } catch (e) {
      console.error("Threads token exchange failure:", e);
      return NextResponse.redirect(new URL("/social?error=threads_token_failed", request.url));
    }

    const connectedAt = new Date().toISOString();
    try {
      await updateUserSocialConnections(userId, current => ({
        ...current,
        threads: {
          ...(current.threads || {}),
          connectedAt,
          accessToken: token.accessToken,
          tokenExpiresAt: token.tokenExpiresAt,
          threadsUserId: token.threadsUserId,
          scope: "threads_basic,threads_content_publish",
        },
      }));
    } catch (e) {
      console.error("Threads save failure:", e);
      return NextResponse.redirect(new URL("/social?error=threads_save_failed", request.url));
    }

    const res = NextResponse.redirect(new URL("/social?success=threads_connected", request.url));
    res.cookies.set("uplora_threads_oauth_state", "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    console.error("Threads callback error:", e);
    return NextResponse.redirect(new URL("/social?error=threads_callback_failed", request.url));
  }
}


