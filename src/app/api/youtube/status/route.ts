export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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
    const social = await getUserSocialConnections(userId);
    const yt = social.youtube || null;

    const hasTokens = !!yt?.accessToken && !!yt?.refreshToken;
    if (!hasTokens) return NextResponse.json({ isConnected: false });

    // If token close to expiry, try refreshing silently
    const expiresAt = yt?.tokenExpiresAt ? Date.parse(yt.tokenExpiresAt) : 0;
    const now = Date.now();
    const needsRefresh = !expiresAt || expiresAt - now < 60_000; // less than 60s remaining

    let effectiveAccessToken = yt!.accessToken!;
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

        effectiveAccessToken = tokenData.access_token || yt!.accessToken!;
        try { broadcast({ type: "youtube.refreshed", userId }); } catch {}
      } catch (e) {
        // Do not disconnect; just report connected with existing channel title
        // Logging only
        console.error("YouTube token refresh failed:", e);
      }
    }

    // Fetch real channel info (title + subscriber count) for UI
    // Note: subscriberCount can be hidden by the channel owner; handle missing gracefully.
    try {
      const channelsResp = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
        {
          headers: { Authorization: `Bearer ${effectiveAccessToken}` },
          cache: "no-store",
        }
      );
      if (channelsResp.ok) {
        const channelsJson = await channelsResp.json().catch(() => ({}));
        const item = Array.isArray(channelsJson?.items) ? channelsJson.items[0] : null;
        const channelId = item?.id || yt?.channelId || null;
        const channelTitle = item?.snippet?.title || yt?.channelTitle || null;
        const subscriberCount = item?.statistics?.subscriberCount ?? (yt as any)?.subscriberCount ?? null;

        // Cache channel info back into socialConnections for faster UI later
        try {
          await updateUserSocialConnections(userId, current => ({
            ...current,
            youtube: {
              ...(current.youtube || {}),
              channelId,
              channelTitle,
              subscriberCount: subscriberCount !== null && subscriberCount !== undefined ? String(subscriberCount) : null,
            },
          }));
        } catch {}

        return NextResponse.json({
          isConnected: true,
          channelId,
          channelTitle,
          subscriberCount: subscriberCount !== null && subscriberCount !== undefined ? String(subscriberCount) : null,
        });
      }
    } catch (e) {
      console.error("YouTube channel info fetch failed:", e);
    }

    return NextResponse.json({
      isConnected: true,
      channelId: yt?.channelId || null,
      channelTitle: yt?.channelTitle || null,
      subscriberCount: (yt as any)?.subscriberCount ? String((yt as any).subscriberCount) : null,
    });
  } catch (e) {
    return NextResponse.json({ isConnected: false });
  }
}