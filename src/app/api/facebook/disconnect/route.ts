export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { broadcast } from "@/lib/realtime";
import { clearFacebookInstagramConnections } from "@/server/services/socialConnections";

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
