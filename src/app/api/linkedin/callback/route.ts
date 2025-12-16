export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { exchangeLinkedInCodeForToken, fetchLinkedInMe, fetchLinkedInUserInfo } from "@/lib/linkedin";
import { updateUserSocialConnections } from "@/server/services/socialConnections";

/**
 * GET /api/linkedin/callback
 *
 * Steps:
 * 1) validate state
 * 2) exchange code -> access_token
 * 3) fetch member id (/v2/me) for posting
 * 4) (best-effort) fetch OIDC userinfo
 * 5) persist in socialConnections.linkedin
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    if (error) {
      console.error("LinkedIn OAuth denied:", { error, errorDescription });
      return NextResponse.redirect(new URL("/social?error=linkedin_oauth_denied", request.url));
    }

    if (!code) return NextResponse.redirect(new URL("/social?error=linkedin_no_code", request.url));

    const expectedState = request.cookies.get("uplora_linkedin_oauth_state")?.value;
    if (!state || !expectedState || state !== expectedState) {
      return NextResponse.redirect(new URL("/social?error=linkedin_state_mismatch", request.url));
    }

    const { userId } = await auth();
    if (!userId) return NextResponse.redirect(new URL("/sign-in?redirect_url=/social", request.url));

    const clientId = process.env.LINKED_IN_CLIENT_ID;
    const clientSecret = process.env.LINKED_IN_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL("/social?error=linkedin_missing_client_config", request.url));
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
    const redirectUri = process.env.LINKED_IN_REDIRECT_URI || `${origin}/api/linkedin/callback`;

    let token;
    try {
      token = await exchangeLinkedInCodeForToken({
        code,
        clientId,
        clientSecret,
        redirectUri,
      });
    } catch (e) {
      console.error("LinkedIn token exchange failure:", e);
      return NextResponse.redirect(new URL("/social?error=linkedin_token_failed", request.url));
    }

    let me;
    try {
      me = await fetchLinkedInMe(token.accessToken);
    } catch (e) {
      console.error("LinkedIn /me fetch failure:", e);
      return NextResponse.redirect(new URL("/social?error=linkedin_me_failed", request.url));
    }

    const info = await fetchLinkedInUserInfo(token.accessToken);
    const connectedAt = new Date().toISOString();
    const authorUrn = `urn:li:person:${me.memberId}`;

    try {
      await updateUserSocialConnections(userId, current => ({
        ...current,
        linkedin: {
          ...(current.linkedin || {}),
          connectedAt,
          accessToken: token.accessToken,
          tokenExpiresAt: token.tokenExpiresAt,
          memberId: me.memberId,
          authorUrn,
          name: info?.name ?? null,
          email: info?.email ?? null,
          picture: info?.picture ?? null,
          scope: token.scope ?? "openid profile email w_member_social",
        },
      }));
    } catch (e) {
      console.error("LinkedIn save failure:", e);
      return NextResponse.redirect(new URL("/social?error=linkedin_save_failed", request.url));
    }

    const res = NextResponse.redirect(new URL("/social?success=linkedin_connected", request.url));
    res.cookies.set("uplora_linkedin_oauth_state", "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    console.error("LinkedIn callback error:", e);
    return NextResponse.redirect(new URL("/social?error=linkedin_callback_failed", request.url));
  }
}


