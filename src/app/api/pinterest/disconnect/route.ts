export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateUserSocialConnections } from "@/server/services/socialConnections";
import { cascadeRemovePlatformFromTeams } from "@/server/services/teamPlatformGuard";

/**
 * POST /api/pinterest/disconnect
 * Clears stored Pinterest connection.
 */
export async function POST(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await updateUserSocialConnections(userId, current => ({ ...current, pinterest: null }));
    try {
      const removed = await cascadeRemovePlatformFromTeams(userId, "pinterest");
      if (removed > 0) console.log(`[pinterest/disconnect] revoked from ${removed} team(s)`);
    } catch (e) {
      console.error("[pinterest/disconnect] cascade failed (non-fatal):", e);
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Pinterest disconnect error:", e);
    return NextResponse.json({ error: "Failed to disconnect Pinterest" }, { status: 500 });
  }
}


