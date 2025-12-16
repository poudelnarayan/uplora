export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { broadcast } from "@/lib/realtime";
import { updateUserSocialConnections } from "@/server/services/socialConnections";

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
