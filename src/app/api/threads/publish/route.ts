export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSocialConnections } from "@/server/services/socialConnections";
import { createThreadsTextPost, publishThreadsPost } from "@/lib/threads";

/**
 * POST /api/threads/publish
 *
 * Body:
 * - text: string (required)
 *
 * Two-step publish:
 * 1) POST /v1.0/{threads_user_id}/threads
 * 2) POST /v1.0/{threads_user_id}/threads_publish
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

    const social = await getUserSocialConnections(userId);
    const th = social.threads;
    if (!th?.accessToken || !th?.threadsUserId) {
      return NextResponse.json({ error: "Threads not connected" }, { status: 400 });
    }

    const { creationId } = await createThreadsTextPost({
      accessToken: th.accessToken,
      threadsUserId: th.threadsUserId,
      text,
    });

    const { postId } = await publishThreadsPost({
      accessToken: th.accessToken,
      threadsUserId: th.threadsUserId,
      creationId,
    });

    return NextResponse.json({ success: true, postId, creationId });
  } catch (e: any) {
    console.error("Threads publish error:", e);
    return NextResponse.json(
      { error: "Failed to publish to Threads", detail: e?.message || String(e) },
      { status: 500 }
    );
  }
}


