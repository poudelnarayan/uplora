export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateUserSocialConnections } from "@/server/services/socialConnections";
import { cascadeRemovePlatformFromTeams } from "@/server/services/teamPlatformGuard";

/**
 * POST /api/linkedin/disconnect
 * Clears stored LinkedIn connection.
 */
export async function POST(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await updateUserSocialConnections(userId, current => ({ ...current, linkedin: null }));
    try {
      const removed = await cascadeRemovePlatformFromTeams(userId, "linkedin");
      if (removed > 0) console.log(`[linkedin/disconnect] revoked from ${removed} team(s)`);
    } catch (e) {
      console.error("[linkedin/disconnect] cascade failed (non-fatal):", e);
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("LinkedIn disconnect error:", e);
    return NextResponse.json({ error: "Failed to disconnect LinkedIn" }, { status: 500 });
  }
}


