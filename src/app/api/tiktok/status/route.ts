export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSocialConnections } from "@/server/services/socialConnections";

/**
 * GET /api/tiktok/status
 *
 * Lightweight status endpoint for the UI.
 * Does not call TikTok API; it only reflects stored connection state.
 */
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ isConnected: false }, { status: 401 });

    const social = await getUserSocialConnections(userId);
    const tt = social.tiktok;

    const isConnected = !!(tt?.accessToken && tt?.refreshToken);

    return NextResponse.json({
      isConnected,
      username: tt?.username ?? null,
      displayName: tt?.displayName ?? null,
      avatarUrl: tt?.avatarUrl ?? null,
      connectedAt: tt?.connectedAt ?? null,
      tokenExpiresAt: tt?.tokenExpiresAt ?? null,
    });
  } catch (e) {
    console.error("TikTok status error:", e);
    return NextResponse.json({ isConnected: false }, { status: 500 });
  }
}


