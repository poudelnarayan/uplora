export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSocialConnections } from "@/server/services/socialConnections";
import { supabaseAdmin } from "@/lib/supabase";
import { ENABLED_PLATFORM_IDS } from "@/config/platforms";

// Returns which platforms are currently connected for the signed-in user
// (or the owner of ?teamId=). Connection checks are driven by the platform
// registry — today that means YouTube only.
function connectedFrom(sc: Awaited<ReturnType<typeof getUserSocialConnections>>): string[] {
  const connected = new Set<string>();
  for (const id of ENABLED_PLATFORM_IDS) {
    if (id === "youtube" && (sc.youtube?.accessToken || sc.youtube?.refreshToken)) {
      connected.add("youtube");
    }
  }
  return Array.from(connected);
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const url = new URL(req.url);
    const teamId = url.searchParams.get("teamId");

    // If teamId is provided, return the *team owner's* connected platforms
    // (members can view) so the UI can indicate whether this workspace can publish.
    if (teamId) {
      const { data: team } = await supabaseAdmin
        .from("teams")
        .select("id, owner_id, name")
        .eq("id", teamId)
        .maybeSingle();

      if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

      const { data: currentUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("clerk_id", userId)
        .maybeSingle();
      const isOwner = currentUser?.id && team.owner_id === currentUser.id;

      if (!isOwner) {
        const { data: membership } = await supabaseAdmin
          .from("team_members")
          .select("user_id, status")
          .eq("team_id", teamId)
          .eq("user_id", userId)
          .maybeSingle();

        const st = String((membership as any)?.status || "").toUpperCase();
        if (!membership || (st && st !== "ACTIVE")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }

      const sc = await getUserSocialConnections(userId, team.id);

      const { data: owner } = await supabaseAdmin
        .from("users")
        .select("name, email")
        .eq("id", String(team.owner_id))
        .maybeSingle();

      return NextResponse.json({
        connectedPlatforms: connectedFrom(sc),
        scope: "team-owner",
        teamId: team.id,
        teamName: team.name || null,
        ownerName: owner?.name || null,
        ownerEmail: owner?.email || null,
      });
    }

    const sc = await getUserSocialConnections(userId);
    return NextResponse.json({ connectedPlatforms: connectedFrom(sc), scope: "user" });
  } catch (e) {
    console.error("GET /api/social-connections/status error", e);
    return NextResponse.json({ connectedPlatforms: [] }, { status: 200 });
  }
}
