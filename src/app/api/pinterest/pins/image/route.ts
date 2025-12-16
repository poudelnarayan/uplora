export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getValidPinterestAccessToken } from "@/server/services/pinterest";
import { createImagePin } from "@/lib/pinterest";

/**
 * POST /api/pinterest/pins/image
 *
 * Body:
 * - boardId: string (required)
 * - title: string (required)
 * - description?: string
 * - imageUrl: string (required)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const boardId = typeof body?.boardId === "string" ? body.boardId : "";
    const title = typeof body?.title === "string" ? body.title : "";
    const description = typeof body?.description === "string" ? body.description : undefined;
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl : "";

    if (!boardId || !title || !imageUrl) {
      return NextResponse.json({ error: "Missing boardId/title/imageUrl" }, { status: 400 });
    }

    const accessToken = await getValidPinterestAccessToken(userId);
    const pin = await createImagePin(accessToken, { boardId, title, description, imageUrl });
    return NextResponse.json({ success: true, pin });
  } catch (e: any) {
    console.error("Pinterest create image pin error:", e);
    return NextResponse.json(
      { error: "Failed to create image pin", detail: e?.message || String(e) },
      { status: 500 }
    );
  }
}


