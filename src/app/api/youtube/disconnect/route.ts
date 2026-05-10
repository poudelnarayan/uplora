export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { broadcast } from "@/lib/realtime";
import { updateUserSocialConnections } from "@/server/services/socialConnections";
import { cascadeRemovePlatformFromTeams } from "@/server/services/teamPlatformGuard";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Clear YouTube connection data in socialConnections
    await updateUserSocialConnections(userId, current => ({
      ...current,
      youtube: null,
    }));

    // Cascade: revoke this platform from every team this owner controls so a
    // dangling allowlist can't grant access to a credential that no longer exists.
    try {
      const removed = await cascadeRemovePlatformFromTeams(userId, "youtube");
      if (removed > 0) console.log(`[youtube/disconnect] revoked from ${removed} team(s)`);
    } catch (e) {
      console.error("[youtube/disconnect] cascade failed (non-fatal):", e);
    }

    try { broadcast({ type: "youtube.disconnected", userId }); } catch {}
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("YouTube disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect YouTube account" },
      { status: 500 }
    );
  }
}
