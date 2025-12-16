export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSocialConnections } from "@/server/services/socialConnections";

/**
 * GET /api/linkedin/status
 * UI helper: reflects stored LinkedIn connection (no external call).
 */
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ isConnected: false }, { status: 401 });

    const social = await getUserSocialConnections(userId);
    const li = social.linkedin;
    const isConnected = !!(li?.accessToken && li?.memberId);

    return NextResponse.json({
      isConnected,
      name: li?.name ?? null,
      email: li?.email ?? null,
      memberId: li?.memberId ?? null,
      connectedAt: li?.connectedAt ?? null,
      tokenExpiresAt: li?.tokenExpiresAt ?? null,
    });
  } catch (e) {
    console.error("LinkedIn status error:", e);
    return NextResponse.json({ isConnected: false }, { status: 500 });
  }
}


