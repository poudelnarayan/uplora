export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateUserSocialConnections } from "@/server/services/socialConnections";
import { cascadeRemovePlatformFromTeams } from "@/server/services/teamPlatformGuard";

/**
 * POST /api/tiktok/disconnect
 *
 * Removes TikTok connection data from `users.socialConnections.tiktok`.
 */
export async function POST(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await updateUserSocialConnections(userId, current => ({
      ...current,
      tiktok: null,
    }));

    try {
      const removed = await cascadeRemovePlatformFromTeams(userId, "tiktok");
      if (removed > 0) console.log(`[tiktok/disconnect] revoked from ${removed} team(s)`);
    } catch (e) {
      console.error("[tiktok/disconnect] cascade failed (non-fatal):", e);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("TikTok disconnect error:", e);
    return NextResponse.json({ error: "Failed to disconnect TikTok" }, { status: 500 });
  }
}


