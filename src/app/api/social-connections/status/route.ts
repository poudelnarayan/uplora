export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSocialConnections } from "@/server/services/socialConnections";
import { supabaseAdmin } from "@/lib/supabase";

// Returns which platforms are currently connected for the signed-in user.
// Used by Team "Add more platforms" UI so it only offers platforms that can actually publish.
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const url = new URL(req.url);
    const teamId = url.searchParams.get("teamId");

    // If teamId is provided, return the *team owner's* connected platforms (members can view).
    // This lets the UI indicate whether the current workspace can publish.
    if (teamId) {
      const { data: team } = await supabaseAdmin
        .from("teams")
        .select("id, ownerId, name")
        .eq("id", teamId)
        .maybeSingle();

      if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

      // Validate requester has access to this team
      if (team.ownerId !== userId) {
        const { data: membership } = await supabaseAdmin
          .from("team_members")
          .select("userId, status")
          .eq("teamId", teamId)
          .eq("userId", userId)
          .maybeSingle();

        const st = String((membership as any)?.status || "").toUpperCase();
        if (!membership || (st && st !== "ACTIVE")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }

      const sc = await getUserSocialConnections(String(team.ownerId));

      const connected = new Set<string>();
      if (sc.facebook?.userAccessToken || sc.facebook?.accessToken) connected.add("facebook");
      if (sc.instagram?.accessToken || sc.instagram?.businessAccountId) connected.add("instagram");
      if (sc.youtube?.accessToken || sc.youtube?.refreshToken) connected.add("youtube");
      if (sc.twitter?.encryptedAccessToken) connected.add("twitter");
      if (sc.linkedin?.accessToken) connected.add("linkedin");
      if (sc.pinterest?.accessToken) connected.add("pinterest");
      if (sc.threads?.accessToken) connected.add("threads");
      if (sc.tiktok?.accessToken) connected.add("tiktok");

      const { data: owner } = await supabaseAdmin
        .from("users")
        .select("name, email")
        .eq("clerkId", String(team.ownerId))
        .maybeSingle();

      return NextResponse.json({
        connectedPlatforms: Array.from(connected),
        scope: "team-owner",
        teamId: team.id,
        teamName: team.name || null,
        ownerName: owner?.name || null,
        ownerEmail: owner?.email || null,
      });
    }

    // Default: current user's connected platforms
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

    return NextResponse.json({ connectedPlatforms: Array.from(connected), scope: "user" });
  } catch (e) {
    console.error("GET /api/social-connections/status error", e);
    return NextResponse.json({ connectedPlatforms: [] }, { status: 200 });
  }
}


