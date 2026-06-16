export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";
import { withTeamRole, TEAM_ROLES } from "@/lib/api-guards";

// Owners can't leave their own team — restrict to non-owner roles. The wrapper
// returns 403 with "Role OWNER is not permitted for this action" automatically.
export const POST = withTeamRole(TEAM_ROLES.NON_OWNERS, async (_request, { teamId, supabaseUser }) => {
  try {
    const { error: removeError } = await supabaseAdmin
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", supabaseUser.id);

    if (removeError) {
      console.error("Error removing user from team:", removeError);
      return NextResponse.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to leave team"),
        { status: 500 },
      );
    }

    broadcast({
      type: "team.member.left",
      payload: {
        teamId,
        userId: supabaseUser.id,
        userEmail: supabaseUser.email,
        userName: supabaseUser.name || supabaseUser.email,
      },
    });

    return NextResponse.json(
      createSuccessResponse({
        message: "Successfully left the team",
        teamId,
      }),
    );
  } catch (error) {
    console.error("Team leave error:", error);
    return NextResponse.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to leave team"),
      { status: 500 },
    );
  }
});
