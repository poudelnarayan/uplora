export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateUserSocialConnections } from "@/server/services/socialConnections";

/**
 * POST /api/pinterest/disconnect
 * Clears stored Pinterest connection.
 */
export async function POST(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await updateUserSocialConnections(userId, current => ({ ...current, pinterest: null }));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Pinterest disconnect error:", e);
    return NextResponse.json({ error: "Failed to disconnect Pinterest" }, { status: 500 });
  }
}


