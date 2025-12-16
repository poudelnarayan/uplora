export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSocialConnections } from "@/server/services/socialConnections";

/**
 * GET /api/pinterest/status
 * UI helper: reflects stored Pinterest connection (no external call).
 */
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ isConnected: false }, { status: 401 });

    const social = await getUserSocialConnections(userId);
    const p = social.pinterest;
    const isConnected = !!(p?.accessToken && p?.refreshToken);

    return NextResponse.json({
      isConnected,
      username: p?.username ?? null,
      connectedAt: p?.connectedAt ?? null,
      tokenExpiresAt: p?.tokenExpiresAt ?? null,
    });
  } catch (e) {
    console.error("Pinterest status error:", e);
    return NextResponse.json({ isConnected: false }, { status: 500 });
  }
}


