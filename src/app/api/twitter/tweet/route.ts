export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getValidXEncryptedAccessToken } from "@/server/services/twitter";
import { postTweet } from "@/lib/twitter";

/**
 * POST /api/twitter/tweet
 *
 * Body:
 * - text: string (required)
 *
 * Posts a text tweet. Only triggered by explicit user action.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

    const encryptedAccessToken = await getValidXEncryptedAccessToken(userId);
    const result = await postTweet(encryptedAccessToken, text);
    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    console.error("X tweet error:", e);
    return NextResponse.json({ error: "Failed to post tweet", detail: e?.message || String(e) }, { status: 500 });
  }
}


