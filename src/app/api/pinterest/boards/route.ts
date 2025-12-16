export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getValidPinterestAccessToken } from "@/server/services/pinterest";
import { getPinterestBoards } from "@/lib/pinterest";

/**
 * GET /api/pinterest/boards
 * Returns boards list using a valid (auto-refreshed) access token.
 */
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const accessToken = await getValidPinterestAccessToken(userId);
    const boards = await getPinterestBoards(accessToken);
    return NextResponse.json({ success: true, boards });
  } catch (e: any) {
    console.error("Pinterest boards route error:", e);
    return NextResponse.json({ error: "Failed to fetch Pinterest boards", detail: e?.message || String(e) }, { status: 500 });
  }
}


