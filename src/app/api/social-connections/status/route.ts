export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSocialConnections } from "@/server/services/socialConnections";

// Returns which platforms are currently connected for the signed-in user.
// Used by Team "Add more platforms" UI so it only offers platforms that can actually publish.
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const sc = await getUserSocialConnections(userId);

    const connected = new Set<string>();
    if (sc.facebook?.userAccessToken || sc.facebook?.accessToken) connected.add("facebook");
    if (sc.instagram?.accessToken || sc.instagram?.businessAccountId) connected.add("instagram");
    if (sc.youtube?.accessToken || sc.youtube?.refreshToken) connected.add("youtube");
    if (sc.twitter?.encryptedAccessToken) connected.add("twitter");
    if (sc.linkedin?.accessToken) connected.add("linkedin");
    if (sc.pinterest?.accessToken) connected.add("pinterest");
    if (sc.threads?.accessToken) connected.add("threads");
    if (sc.tiktok?.accessToken) connected.add("tiktok");

    return NextResponse.json({ connectedPlatforms: Array.from(connected) });
  } catch (e) {
    console.error("GET /api/social-connections/status error", e);
    return NextResponse.json({ connectedPlatforms: [] }, { status: 200 });
  }
}


