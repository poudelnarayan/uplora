export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";
import { getUserSocialConnections, updateUserSocialConnections } from "@/server/services/socialConnections";

async function refreshAccessToken(refreshToken: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    redirect_uri: redirectUri,
  });

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(`Refresh failed: ${err.error || resp.statusText}`);
  }

  return resp.json();
}

export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ isConnected: false });

    // Prefer unified storage in users.socialConnections.youtube
    let social = await getUserSocialConnections(userId);
    let yt = social.youtube || null;

    // Back-compat migration: if legacy columns exist but JSON doesn't, copy them once.
    if (!yt?.accessToken || !yt?.refreshToken) {
      const { data: legacy } = await supabaseAdmin
        .from("users")
        .select("youtubeAccessToken,youtubeRefreshToken,youtubeExpiresAt,youtubeChannelId,youtubeChannelTitle")
        .eq("clerkId", userId)
        .single();
      const legacyHasTokens = !!legacy?.youtubeAccessToken && !!legacy?.youtubeRefreshToken;
      if (legacyHasTokens) {
        try {
          const connectedAt = new Date().toISOString();
          await updateUserSocialConnections(userId, current => ({
            ...current,
            youtube: {
              ...(current.youtube || {}),
              connectedAt,
              accessToken: legacy.youtubeAccessToken,
              refreshToken: legacy.youtubeRefreshToken,
              tokenExpiresAt: legacy.youtubeExpiresAt || null,
              channelId: legacy.youtubeChannelId || null,
              channelTitle: legacy.youtubeChannelTitle || null,
            },
          }));
          // Best-effort: clear legacy columns after migrating
          try {
            await supabaseAdmin
              .from("users")
              .update({
                youtubeAccessToken: null,
                youtubeRefreshToken: null,
                youtubeExpiresAt: null,
                youtubeChannelId: null,
                youtubeChannelTitle: null,
                updatedAt: new Date().toISOString(),
              })
              .eq("clerkId", userId);
          } catch {}
          social = await getUserSocialConnections(userId);
          yt = social.youtube || null;
        } catch (e) {
          // If migration fails, continue using legacy values for this request
          yt = {
            accessToken: legacy.youtubeAccessToken,
            refreshToken: legacy.youtubeRefreshToken,
            tokenExpiresAt: legacy.youtubeExpiresAt || null,
            channelId: legacy.youtubeChannelId || null,
            channelTitle: legacy.youtubeChannelTitle || null,
          } as any;
        }
      }
    }

    const hasTokens = !!yt?.accessToken && !!yt?.refreshToken;
    if (!hasTokens) return NextResponse.json({ isConnected: false });

    // If token close to expiry, try refreshing silently
    const expiresAt = yt?.tokenExpiresAt ? Date.parse(yt.tokenExpiresAt) : 0;
    const now = Date.now();
    const needsRefresh = !expiresAt || expiresAt - now < 60_000; // less than 60s remaining

    if (needsRefresh) {
      try {
        const origin = process.env.NEXT_PUBLIC_SITE_URL || '';
        const redirectUri = process.env.YT_REDIRECT_URI || `${origin}/api/youtube/connect`;
        const tokenData = await refreshAccessToken(yt!.refreshToken!, redirectUri);
        const newExpiresAt = tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null;

        await updateUserSocialConnections(userId, current => ({
          ...current,
          youtube: {
            ...(current.youtube || {}),
            accessToken: tokenData.access_token || yt!.accessToken,
            refreshToken: tokenData.refresh_token || yt!.refreshToken,
            tokenExpiresAt: newExpiresAt,
          },
        }));

        try { broadcast({ type: "youtube.refreshed", userId }); } catch {}
      } catch (e) {
        // Do not disconnect; just report connected with existing channel title
        // Logging only
        console.error("YouTube token refresh failed:", e);
      }
    }

    return NextResponse.json({
      isConnected: true,
      channelTitle: yt?.channelTitle || null,
    });
  } catch (e) {
    return NextResponse.json({ isConnected: false });
  }
}