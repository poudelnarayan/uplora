export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSocialConnections } from "@/server/services/socialConnections";

/**
 * GET /api/twitter/status
 * UI helper: reflects stored X connection (no external call).
 */
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ isConnected: false }, { status: 401 });

    const social = await getUserSocialConnections(userId);
    const tw = social.twitter;
    const isConnected = !!(tw?.encryptedAccessToken && tw?.encryptedRefreshToken);
    return NextResponse.json({
      isConnected,
      username: tw?.username ?? null,
      name: tw?.name ?? null,
      connectedAt: tw?.connectedAt ?? null,
      tokenExpiresAt: tw?.tokenExpiresAt ?? null,
    });
  } catch (e) {
    console.error("X status error:", e);
    return NextResponse.json({ isConnected: false }, { status: 500 });
  }
}


