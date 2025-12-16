export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getValidPinterestAccessToken } from "@/server/services/pinterest";
import { getPinterestUser } from "@/lib/pinterest";

/**
 * GET /api/pinterest/user
 * Returns Pinterest user_account using a valid (auto-refreshed) access token.
 */
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const accessToken = await getValidPinterestAccessToken(userId);
    const user = await getPinterestUser(accessToken);
    return NextResponse.json({ success: true, user });
  } catch (e: any) {
    console.error("Pinterest user route error:", e);
    return NextResponse.json({ error: "Failed to fetch Pinterest user", detail: e?.message || String(e) }, { status: 500 });
  }
}


