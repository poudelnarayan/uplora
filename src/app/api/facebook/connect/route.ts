export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { broadcast } from "@/lib/realtime";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");
    const requestedPageId = searchParams.get("page_id");

    const expectedState = request.cookies.get("uplora_fb_oauth_state")?.value;
    const intentCookie = (request.cookies.get("uplora_meta_oauth_intent")?.value || "facebook").toLowerCase();
    const intent: "facebook" | "instagram" = intentCookie === "instagram" ? "instagram" : "facebook";

    console.log("Facebook OAuth callback received:", {
      hasCode: !!code,
      error,
      state
    });

    if (error) {
      console.error("Facebook OAuth error:", error);
      return NextResponse.redirect(new URL("/social?error=facebook_connection_failed", request.url));
    }

    if (!code) {
      console.error("No authorization code received");
      return NextResponse.redirect(new URL("/social?error=facebook_no_code", request.url));
    }

    if (!state || !expectedState || state !== expectedState) {
      console.error("Facebook OAuth state mismatch:", { state, expectedState: !!expectedState });
      return NextResponse.redirect(new URL("/social?error=facebook_state_mismatch", request.url));
    }

    const { userId } = await auth();
    
    if (!userId) {
      // If no user is authenticated, redirect to sign in with the code
      return NextResponse.redirect(new URL(`/sign-in?redirect_url=${encodeURIComponent(`/api/facebook/connect?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`)}`, request.url));
    }

    // Determine redirect URI based on environment
    const reqOrigin = (() => { 
      try { 
        return new URL(request.url).origin; 
      } catch { 
        return 'http://localhost:3000'; 
      } 
    })();
    const isLocal = /localhost|127\.0\.0\.1/i.test(reqOrigin);
    const origin = isLocal ? reqOrigin : (process.env.NEXT_PUBLIC_SITE_URL || reqOrigin);
    const redirectUri = isLocal
      ? `${reqOrigin}/api/facebook/connect`
      : (process.env.META_REDIRECT_URI || `${origin}/api/facebook/connect`);

    const apiVersion = process.env.META_API_VERSION || "v19.0";

    console.log('FB_CONNECT_DIAGNOSTIC:', {
      client_id: process.env.META_APP_ID,
      client_secret_set: !!process.env.META_APP_SECRET,
      redirect_uri: redirectUri,
      code_received: !!code,
      userId: userId
    });

    // 1) Exchange code -> short-lived user access token
    const shortTokenRes = await fetch(`https://graph.facebook.com/${apiVersion}/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        code,
        redirect_uri: redirectUri,
      }),
    });
    const shortToken = await shortTokenRes.json();
    if (!shortTokenRes.ok || shortToken.error || !shortToken.access_token) {
      console.error("Facebook short-lived token exchange failed:", shortToken);
      return NextResponse.redirect(new URL("/social?error=facebook_token_failed", request.url));
    }

    // 2) Exchange short-lived -> long-lived user access token
    const longTokenUrl = new URL(`https://graph.facebook.com/${apiVersion}/oauth/access_token`);
    longTokenUrl.searchParams.set("grant_type", "fb_exchange_token");
    longTokenUrl.searchParams.set("client_id", process.env.META_APP_ID!);
    longTokenUrl.searchParams.set("client_secret", process.env.META_APP_SECRET!);
    longTokenUrl.searchParams.set("fb_exchange_token", shortToken.access_token);

    const longTokenRes = await fetch(longTokenUrl.toString(), { method: "GET" });
    const longToken = await longTokenRes.json();
    if (!longTokenRes.ok || longToken.error || !longToken.access_token) {
      console.error("Facebook long-lived token exchange failed:", longToken);
      return NextResponse.redirect(new URL("/social?error=facebook_long_token_failed", request.url));
    }

    const longLivedUserToken = longToken.access_token as string;
    const tokenExpiresAt = typeof longToken.expires_in === "number"
      ? new Date(Date.now() + longToken.expires_in * 1000).toISOString()
      : null;

    // 3) Fetch user info
    const userResponse = await fetch(
      `https://graph.facebook.com/${apiVersion}/me?fields=id,name&access_token=${encodeURIComponent(longLivedUserToken)}`
    );
    const userData = await userResponse.json();
    if (!userResponse.ok || userData.error) {
      console.error("Failed to fetch Facebook user data:", userData);
      return NextResponse.redirect(new URL("/social?error=facebook_user_failed", request.url));
    }

    // 4) Fetch pages (+ page tokens)
    const pagesUrl = new URL(`https://graph.facebook.com/${apiVersion}/me/accounts`);
    pagesUrl.searchParams.set("fields", "id,name,access_token,instagram_business_account");
    pagesUrl.searchParams.set("access_token", longLivedUserToken);

    const pagesRes = await fetch(pagesUrl.toString(), { method: "GET" });
    const pagesData = await pagesRes.json();
    if (!pagesRes.ok || pagesData.error) {
      console.error("Failed to fetch /me/accounts:", pagesData);
      return NextResponse.redirect(new URL("/social?error=facebook_pages_failed", request.url));
    }

    const pages: Array<{
      id: string;
      name?: string;
      access_token?: string;
      instagram_business_account?: { id: string };
    }> = Array.isArray(pagesData?.data) ? pagesData.data : [];

    if (pages.length === 0) {
      console.error("No Facebook Pages returned from /me/accounts");
      return NextResponse.redirect(new URL("/social?error=facebook_no_pages", request.url));
    }

    const findPage = () => {
      if (requestedPageId) {
        const p = pages.find(x => x.id === requestedPageId);
        if (p) return p;
      }
      if (intent === "instagram") {
        const withIg = pages.find(x => !!x.instagram_business_account?.id);
        if (withIg) return withIg;
      }
      return pages[0];
    };

    const selectedPage = findPage();
    if (!selectedPage?.access_token) {
      console.error("Selected page missing access token", { selectedPageId: selectedPage?.id });
      return NextResponse.redirect(new URL("/social?error=facebook_page_token_missing", request.url));
    }

    // 5) From selected Page, get instagram_business_account (if not present)
    let instagramBusinessAccountId: string | null = selectedPage.instagram_business_account?.id || null;

    if (!instagramBusinessAccountId) {
      const igLookupUrl = new URL(`https://graph.facebook.com/${apiVersion}/${selectedPage.id}`);
      igLookupUrl.searchParams.set("fields", "instagram_business_account");
      igLookupUrl.searchParams.set("access_token", selectedPage.access_token);

      const igLookupRes = await fetch(igLookupUrl.toString(), { method: "GET" });
      const igLookup = await igLookupRes.json();
      if (igLookupRes.ok && !igLookup.error && igLookup?.instagram_business_account?.id) {
        instagramBusinessAccountId = igLookup.instagram_business_account.id;
      }
    }

    // Persist connection (user token + selected Page + Page token + IG business id if present)
    const connectedAt = new Date().toISOString();
    const sanitizedPages = pages.map(p => ({
      id: p.id,
      name: p.name || null,
      hasPageToken: !!p.access_token,
      instagramBusinessAccountId: p.instagram_business_account?.id || null,
    }));

    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("socialConnections")
      .eq("id", userId)
      .single();

    const socialConnections = {
      ...(currentUser?.socialConnections || {}),
      facebook: {
        connectedAt,
        userId: userData.id,
        userName: userData.name,
        userAccessToken: longLivedUserToken,
        userTokenExpiresAt: tokenExpiresAt,
        pages: sanitizedPages,
        selectedPageId: selectedPage.id,
        selectedPageName: selectedPage.name || null,
        selectedPageAccessToken: selectedPage.access_token,
        instagramBusinessAccountId,
      },
      instagram: instagramBusinessAccountId
        ? {
            connectedAt,
            businessAccountId: instagramBusinessAccountId,
            pageId: selectedPage.id,
          }
        : (currentUser?.socialConnections?.instagram || null),
    };

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        socialConnections,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Failed to save Facebook connection:", updateError);
      return NextResponse.redirect(new URL("/social?error=facebook_save_failed", request.url));
    }

    // Broadcast the connection update
    broadcast({
      type: "social.facebook.connected",
      payload: {
        userId,
        platform: "facebook",
        userName: userData.name,
        pageId: selectedPage.id,
        instagramBusinessAccountId,
      },
    });

    // Clear CSRF cookie
    const successKey =
      intent === "instagram" && instagramBusinessAccountId
        ? "instagram_connected"
        : "facebook_connected";
    const redirectUrl = isLocal ? `${reqOrigin}/social?success=${successKey}` : `${origin}/social?success=${successKey}`;
    const res = NextResponse.redirect(new URL(redirectUrl, request.url));
    res.cookies.set("uplora_fb_oauth_state", "", { path: "/", maxAge: 0 });
    res.cookies.set("uplora_meta_oauth_intent", "", { path: "/", maxAge: 0 });
    return res;

  } catch (error) {
    console.error("Facebook OAuth callback error:", error);
    return NextResponse.redirect(new URL("/social?error=facebook_connection_failed", request.url));
  }
}
