export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSocialConnections } from "@/server/services/socialConnections";

/**
 * Step 7: Post to Instagram (2 calls, always)
 * 1) POST /{ig-user-id}/media (create container)
 * 2) POST /{ig-user-id}/media_publish (publish)
 *
 * Body:
 * - imageUrl: string (publicly accessible URL)
 * - caption?: string
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({} as any));
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";
    const caption = typeof body?.caption === "string" ? body.caption : "Hello Instagram";

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    const social = await getUserSocialConnections(userId);
    const fb = social.facebook;
    const igBusinessId = fb?.instagramBusinessAccountId || social.instagram?.businessAccountId;
    const pageToken = fb?.selectedPageAccessToken;

    if (!igBusinessId || !pageToken) {
      return NextResponse.json(
        { error: "Instagram not connected (missing igBusinessId/page token). Please reconnect." },
        { status: 400 }
      );
    }

    const apiVersion = process.env.META_API_VERSION || "v19.0";

    // 1) Create container
    const containerUrl = new URL(`https://graph.facebook.com/${apiVersion}/${igBusinessId}/media`);
    containerUrl.searchParams.set("image_url", imageUrl);
    containerUrl.searchParams.set("caption", caption);
    containerUrl.searchParams.set("access_token", pageToken);

    const containerRes = await fetch(containerUrl.toString(), { method: "POST" });
    const containerData = await containerRes.json();
    if (!containerRes.ok || containerData?.error || !containerData?.id) {
      console.error("IG create container failed:", containerData);
      return NextResponse.json(
        { error: "Failed to create Instagram media container", meta: containerData?.error || containerData },
        { status: 400 }
      );
    }

    const creationId = containerData.id as string;

    // 2) Publish
    const publishUrl = new URL(`https://graph.facebook.com/${apiVersion}/${igBusinessId}/media_publish`);
    publishUrl.searchParams.set("creation_id", creationId);
    publishUrl.searchParams.set("access_token", pageToken);

    const publishRes = await fetch(publishUrl.toString(), { method: "POST" });
    const publishData = await publishRes.json();
    if (!publishRes.ok || publishData?.error) {
      console.error("IG publish failed:", publishData);
      return NextResponse.json(
        { error: "Failed to publish Instagram media", creationId, meta: publishData?.error || publishData },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      igBusinessId,
      creationId,
      mediaId: publishData?.id || null,
    });
  } catch (e) {
    console.error("IG publish error:", e);
    return NextResponse.json({ error: "Failed to publish to Instagram" }, { status: 500 });
  }
}


