export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSocialConnections } from "@/server/services/socialConnections";

/**
 * GET /api/threads/status
 * UI helper: reads stored Threads connection state (no external call).
 */
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ isConnected: false }, { status: 401 });

    const social = await getUserSocialConnections(userId);
    const th = social.threads;

    const isConnected = !!(th?.accessToken && th?.threadsUserId);
    return NextResponse.json({
      isConnected,
      threadsUserId: th?.threadsUserId ?? null,
      connectedAt: th?.connectedAt ?? null,
      tokenExpiresAt: th?.tokenExpiresAt ?? null,
    });
  } catch (e) {
    console.error("Threads status error:", e);
    return NextResponse.json({ isConnected: false }, { status: 500 });
  }
}


