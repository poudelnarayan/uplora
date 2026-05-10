export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { publishInstagramImagePost } from "@/lib/instagram";
import { getUserSocialConnections } from "@/server/services/socialConnections";
import { checkTeamCanPublish } from "@/server/services/teamPlatformGuard";

/**
 * Publish an Instagram image post using stored Instagram credentials.
 *
 * Body:
 * - imageUrl: string (required)
 * - caption?: string
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl : null;
    const caption = typeof body?.caption === "string" ? body.caption : undefined;
    const teamId = typeof body?.teamId === "string" ? body.teamId : null;

    if (!imageUrl) {
      return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
    }

    // Per-team platform allowlist guard. Only kicks in when teamId is supplied
    // (team-aware publish flows must pass it; ad-hoc personal calls don't).
    if (teamId) {
      const decision = await checkTeamCanPublish(teamId, "instagram");
      if (!decision.allowed) {
        return NextResponse.json(
          { error: decision.reason, code: decision.code, teamName: decision.teamName, enabledPlatforms: decision.enabledPlatforms },
          { status: 403 }
        );
      }
    }

    // Load stored Instagram credentials
    const socialConnections = await getUserSocialConnections(userId);
    const ig = socialConnections.instagram;
    const instagramUserId = ig?.businessAccountId || ig?.instagramUserId;
    const accessToken = ig?.accessToken;
    if (!instagramUserId || !accessToken) {
      return NextResponse.json(
        { error: "Instagram not connected. Please connect Instagram first." },
        { status: 400 }
      );
    }

    const result = await publishInstagramImagePost({
      instagramUserId: String(instagramUserId),
      accessToken: String(accessToken),
      imageUrl,
      caption,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (e: any) {
    console.error("Instagram publish-image error:", e);
    return NextResponse.json(
      { error: "Failed to publish Instagram image", detail: e?.message || String(e) },
      { status: 500 }
    );
  }
}


