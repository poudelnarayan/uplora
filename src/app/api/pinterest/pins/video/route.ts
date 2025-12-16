export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getValidPinterestAccessToken } from "@/server/services/pinterest";
import { createVideoPin } from "@/lib/pinterest";

/**
 * POST /api/pinterest/pins/video
 *
 * Body:
 * - boardId: string (required)
 * - title: string (required)
 * - description?: string
 * - videoUrl: string (required)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const boardId = typeof body?.boardId === "string" ? body.boardId : "";
    const title = typeof body?.title === "string" ? body.title : "";
    const description = typeof body?.description === "string" ? body.description : undefined;
    const videoUrl = typeof body?.videoUrl === "string" ? body.videoUrl : "";

    if (!boardId || !title || !videoUrl) {
      return NextResponse.json({ error: "Missing boardId/title/videoUrl" }, { status: 400 });
    }

    const accessToken = await getValidPinterestAccessToken(userId);
    const pin = await createVideoPin(accessToken, { boardId, title, description, videoUrl });
    return NextResponse.json({ success: true, pin });
  } catch (e: any) {
    console.error("Pinterest create video pin error:", e);
    return NextResponse.json(
      { error: "Failed to create video pin", detail: e?.message || String(e) },
      { status: 500 }
    );
  }
}


