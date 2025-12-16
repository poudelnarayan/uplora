export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateUserSocialConnections } from "@/server/services/socialConnections";

/**
 * POST /api/threads/disconnect
 * Clears stored Threads connection.
 */
export async function POST(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await updateUserSocialConnections(userId, current => ({ ...current, threads: null }));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Threads disconnect error:", e);
    return NextResponse.json({ error: "Failed to disconnect Threads" }, { status: 500 });
  }
}


