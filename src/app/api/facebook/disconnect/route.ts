export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { broadcast } from "@/lib/realtime";
import { clearFacebookInstagramConnections } from "@/server/services/socialConnections";
import { cascadeRemovePlatformFromTeams } from "@/server/services/teamPlatformGuard";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Disconnecting Facebook for user:", userId);

    try {
      await clearFacebookInstagramConnections(userId);
    } catch (updateError) {
      console.error("Failed to disconnect Facebook:", updateError);
      return NextResponse.json({ error: "Failed to disconnect Facebook" }, { status: 500 });
    }

    console.log("Facebook disconnected successfully");

    // Cascade: FB disconnect strips both Facebook AND Instagram from team
    // allowlists since IG publishing depends on the FB page token.
    try {
      const fbRemoved = await cascadeRemovePlatformFromTeams(userId, "facebook");
      const igRemoved = await cascadeRemovePlatformFromTeams(userId, "instagram");
      if (fbRemoved + igRemoved > 0) console.log(`[facebook/disconnect] revoked from ${fbRemoved + igRemoved} team-platform pair(s)`);
    } catch (e) {
      console.error("[facebook/disconnect] cascade failed (non-fatal):", e);
    }

    // Broadcast the disconnection
    broadcast({
      type: "social.facebook.disconnected",
      payload: { userId, platform: "facebook" }
    });

    return NextResponse.json({ success: true, message: "Facebook disconnected successfully" });

  } catch (error) {
    console.error("Facebook disconnect error:", error);
    return NextResponse.json({ error: "Failed to disconnect Facebook" }, { status: 500 });
  }
}
