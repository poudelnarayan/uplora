export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";

export async function GET(
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

    // Get user from Supabase
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

    // Check if user has access (owner or member)
    let hasAccess = team.ownerId === user.id;
    
    if (!hasAccess) {
      const { data: membership } = await supabaseAdmin
        .from('teamMembers')
        .select('id')
        .eq('teamId', teamId)
        .eq('userId', user.id)
        .eq('status', 'ACTIVE')
        .single();
      
      hasAccess = !!membership;
    }

    if (!hasAccess) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "No access to this team"), 
        { status: 403 }
      );
    }

    // Get team owner details
    const { data: owner, error: ownerError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, image')
      .eq('id', team.ownerId)
      .single();

    // Get team members
    const { data: members, error: membersError } = await supabaseAdmin
      .from('teamMembers')
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
      .eq('teamId', teamId)
      .order('joinedAt', { ascending: true });

    // Get team invitations
    const { data: invites, error: invitesError } = await supabaseAdmin
      .from('teamInvites')
      .select('*')
      .eq('teamId', teamId)
      .order('createdAt', { ascending: false });

    return NextResponse.json(createSuccessResponse({
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        owner: owner || null,
        createdAt: team.createdAt,
        ownerId: team.ownerId,
        isPersonal: team.isPersonal
      },
      members: (members || []).map(m => ({
        id: m.id,
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt,
        user: m.users
      })),
      invites: invites || []
    }));

  } catch (e) {
    console.error("Error fetching team details:", e);
    return NextResponse.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch team details"), 
      { status: 500 }
    );
  }
}
