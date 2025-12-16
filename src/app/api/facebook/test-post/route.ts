export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSocialConnections } from "@/server/services/socialConnections";

/**
 * Step 6: Test Facebook posting FIRST
 * POST /{page-id}/feed
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({} as any));
    const message = typeof body?.message === "string" && body.message.trim()
      ? body.message.trim()
      : "Hello from Uplora";

    const social = await getUserSocialConnections(userId);
    const fb = social.facebook;
    const pageId = fb?.selectedPageId;
    const pageToken = fb?.selectedPageAccessToken;

    if (!pageId || !pageToken) {
      return NextResponse.json(
        { error: "Facebook not connected (missing selected page/token). Please reconnect." },
        { status: 400 }
      );
    }

    const apiVersion = process.env.META_API_VERSION || "v19.0";
    const postUrl = new URL(`https://graph.facebook.com/${apiVersion}/${pageId}/feed`);
    postUrl.searchParams.set("message", message);
    postUrl.searchParams.set("access_token", pageToken);

    const res = await fetch(postUrl.toString(), { method: "POST" });
    const data = await res.json();

    if (!res.ok || data?.error) {
      console.error("FB test-post failed:", data);
      return NextResponse.json(
        {
          error: "Failed to post to Facebook Page feed",
          meta: data?.error || data,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      pageId,
      postId: data?.id || null,
      message,
    });
  } catch (e) {
    console.error("FB test-post error:", e);
    return NextResponse.json({ error: "Failed to test Facebook post" }, { status: 500 });
  }
}


