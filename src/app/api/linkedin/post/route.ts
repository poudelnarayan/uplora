export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSocialConnections } from "@/server/services/socialConnections";
import { postLinkedInUgcText } from "@/lib/linkedin";
import { checkTeamCanPublish } from "@/server/services/teamPlatformGuard";

/**
 * POST /api/linkedin/post
 *
 * Body:
 * - text: string (required)
 *
 * Posts a simple text update using UGC Posts API.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const teamId = typeof body?.teamId === "string" ? body.teamId : null;
    if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

    if (teamId) {
      const decision = await checkTeamCanPublish(teamId, "linkedin");
      if (!decision.allowed) {
        return NextResponse.json(
          { error: decision.reason, code: decision.code, teamName: decision.teamName, enabledPlatforms: decision.enabledPlatforms },
          { status: 403 }
        );
      }
    }

    const social = await getUserSocialConnections(userId);
    const li = social.linkedin;
    if (!li?.accessToken || !(li?.authorUrn || li?.memberId)) {
      return NextResponse.json({ error: "LinkedIn not connected" }, { status: 400 });
    }

    const authorUrn = li.authorUrn || `urn:li:person:${li.memberId}`;
    const result = await postLinkedInUgcText({
      accessToken: li.accessToken,
      authorUrn,
      text,
      visibility: "PUBLIC",
    });

    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    console.error("LinkedIn post error:", e);
    return NextResponse.json({ error: "Failed to post to LinkedIn", detail: e?.message || String(e) }, { status: 500 });
  }
}


