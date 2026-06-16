export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";
import { withTeamRole, TEAM_ROLES } from "@/lib/api-guards";

export const GET = withTeamRole(TEAM_ROLES.ALL, async (_request, { teamId }) => {
  try {
    const { data: team, error: teamError } = await supabaseAdmin
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Team not found"),
        { status: 404 },
      );
    }

    const { data: owner } = await supabaseAdmin
      .from("users")
      .select("id, name, email, image")
      .eq("id", team.owner_id)
      .single();

    const { data: members } = await supabaseAdmin
      .from("team_members")
      .select(`
        id,
        role,
        status,
        joinedAt,
        users (
          id,
          name,
          email,
          image
        )
      `)
      .eq("team_id", teamId)
      .order("joined_at", { ascending: true });

    const { data: invites } = await supabaseAdmin
      .from("team_invites")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    return NextResponse.json(
      createSuccessResponse({
        team: {
          id: team.id,
          name: team.name,
          description: team.description,
          owner: owner || null,
          createdAt: team.created_at,
          ownerId: team.owner_id,
          isPersonal: team.is_personal,
        },
        members: (members || []).map((m) => ({
          id: m.id,
          role: m.role,
          status: m.status,
          joinedAt: m.joinedAt,
          user: m.users,
        })),
        invites: invites || [],
      }),
    );
  } catch (e) {
    console.error("Error fetching team details:", e);
    return NextResponse.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch team details"),
      { status: 500 },
    );
  }
});
