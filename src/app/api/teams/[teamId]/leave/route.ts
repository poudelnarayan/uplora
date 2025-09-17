export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";

export async function POST(
  request: NextRequest,
  context: { params: { teamId: string } }
) {
  try {
    const { teamId } = context.params;
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required"),
        { status: 401 }
      );
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerkId', userId)
      .single();
    
    if (userError || !user) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "User not found"),
        { status: 404 }
      );
    }

    // Get team details
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();
    
    if (teamError || !team) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Team not found"),
        { status: 404 }
      );
    }

    // Prevent owner from leaving their own team
    if (team.ownerId === user.id) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "Team owners cannot leave their own team. Transfer ownership or delete the team instead."),
        { status: 403 }
      );
    }

    // Check if user is actually a member of this team
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('teamMembers')
      .select('*')
      .eq('teamId', teamId)
      .eq('userId', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "You are not a member of this team"),
        { status: 404 }
      );
    }

    // Remove user from team
    const { error: removeError } = await supabaseAdmin
      .from('teamMembers')
      .delete()
      .eq('teamId', teamId)
      .eq('userId', user.id);

    if (removeError) {
      console.error("Error removing user from team:", removeError);
      return NextResponse.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to leave team"),
        { status: 500 }
      );
    }

    // Broadcast team member left event
    broadcast({
      type: "team.member.left",
      payload: { 
        teamId: teamId, 
        userId: user.id,
        userEmail: user.email,
        userName: user.name || user.email
      },
    });

    return NextResponse.json(createSuccessResponse({
      message: "Successfully left the team",
      teamId: teamId
    }));

  } catch (error) {
    console.error("Team leave error:", error);
    return NextResponse.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to leave team"),
      { status: 500 }
    );
  }
}
