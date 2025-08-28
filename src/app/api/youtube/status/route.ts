export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";

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

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select(
        "youtubeAccessToken, youtubeRefreshToken, youtubeExpiresAt, youtubeChannelTitle"
      )
      .eq("clerkId", userId)
      .single();

    if (error) return NextResponse.json({ isConnected: false });

    const hasTokens = !!user?.youtubeAccessToken && !!user?.youtubeRefreshToken;
    if (!hasTokens) return NextResponse.json({ isConnected: false });

    // If token close to expiry, try refreshing silently
    const expiresAt = user.youtubeExpiresAt ? Date.parse(user.youtubeExpiresAt) : 0;
    const now = Date.now();
    const needsRefresh = !expiresAt || expiresAt - now < 60_000; // less than 60s remaining

    if (needsRefresh) {
      try {
        const redirectUri = process.env.YT_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.uplora.io'}/api/youtube/connect`;
        const tokenData = await refreshAccessToken(user.youtubeRefreshToken, redirectUri);
        const newExpiresAt = tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null;

        await supabaseAdmin
          .from("users")
          .update({
            youtubeAccessToken: tokenData.access_token || user.youtubeAccessToken,
            youtubeRefreshToken: tokenData.refresh_token || user.youtubeRefreshToken,
            youtubeExpiresAt: newExpiresAt,
            updatedAt: new Date().toISOString(),
          })
          .eq("clerkId", userId);

        try { broadcast({ type: "youtube.refreshed", userId }); } catch {}
      } catch (e) {
        // Do not disconnect; just report connected with existing channel title
        // Logging only
        console.error("YouTube token refresh failed:", e);
      }
    }

    return NextResponse.json({
      isConnected: true,
      channelTitle: user.youtubeChannelTitle || null,
    });
  } catch (e) {
    return NextResponse.json({ isConnected: false });
  }
}