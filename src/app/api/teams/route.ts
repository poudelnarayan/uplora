export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";
import { broadcast } from "@/lib/realtime";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required"),
        { status: 401 }
      );
    }

    // Get user details from Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    const userName = clerkUser.fullName || clerkUser.firstName || "";
    const userImage = clerkUser.imageUrl || "";

    // Ensure user exists in database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        clerkId: userId,
        email: userEmail || "", 
        name: userName, 
        image: userImage,
        updatedAt: new Date().toISOString()
      }, {
        onConflict: 'clerkId'
      })
      .select()
      .single();

    if (userError) {
      console.error("User sync error:", userError);
      return NextResponse.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to sync user"),
        { status: 500 }
      );
    }

    const body = await request.json();
    
    // Basic validation
    const { name, description } = body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Team name is required"),
        { status: 400 }
      );
    }

    // Check for duplicate team names for this user
    const { data: existingTeam, error: checkError } = await supabaseAdmin
      .from('teams')
      .select('id')
      .eq('ownerId', user.id)
      .eq('name', name.trim())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Supabase error:", checkError);
      return NextResponse.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to check existing teams"),
        { status: 500 }
      );
    }

    if (existingTeam) {
      return NextResponse.json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR, 
          "You already have a team with this name", 
          { name: "Team name already exists" }
        ),
        { status: 400 }
      );
    }

    // Create new team (always a team workspace, not personal)
    const teamId = `team-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();
    const { data: team, error: createError } = await supabaseAdmin
      .from('teams')
      .insert({
        id: teamId,
        name: name.trim(),
        description: description?.trim() || "",
        ownerId: user.id,
        isPersonal: false, // Team workspaces are never personal
        createdAt: now,
        updatedAt: now
      })
      .select()
      .single();

    if (createError) {
      console.error("Supabase error:", createError);
      return NextResponse.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create team"),
        { status: 500 }
      );
    }

    // Add the owner as a team member with OWNER role
    const { error: memberError } = await supabaseAdmin
      .from('team_members')
      .insert({
        teamId: team.id,
        userId: user.id,
        role: 'OWNER',
        status: 'ACTIVE',
        joinedAt: now
      });

    if (memberError) {
      console.error("Failed to add owner as team member:", memberError);
      // Don't fail the request, but log the error
    }

    // Realtime notify all connected clients to refresh team lists
    broadcast({
      type: "team.created",
      payload: { id: team.id, name: team.name, description: team.description },
    });

    return NextResponse.json(createSuccessResponse({
      data: {
        id: team.id,
        name: team.name,
        description: team.description,
        createdAt: team.createdAt,
        isPersonal: false,
        isOwner: true,
        role: 'OWNER'
      }
    }));
  } catch (error) {
    console.error("Team creation error:", error);
    return NextResponse.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create team"),
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required"),
        { status: 401 }
      );
    }

    // Get user details from Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    const userName = clerkUser.fullName || clerkUser.firstName || "";
    const userImage = clerkUser.imageUrl || "";

    // Ensure user exists in database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        clerkId: userId,
        email: userEmail || "", 
        name: userName, 
        image: userImage,
        updatedAt: new Date().toISOString()
      }, {
        onConflict: 'clerkId'
      })
      .select()
      .single();

    if (userError) {
      console.error("User sync error:", userError);
      return NextResponse.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to sync user"),
        { status: 500 }
      );
    }

    // Ensure user has a personal workspace
    let { data: personalTeam, error: personalError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('ownerId', user.id)
      .eq('isPersonal', true)
      .single();

    if (personalError && personalError.code === 'PGRST116') {
      // Create personal workspace if it doesn't exist
      const personalTeamId = `personal-${user.id}`;
      const now = new Date().toISOString();
      const { data: newPersonalTeam, error: createError } = await supabaseAdmin
        .from('teams')
        .insert({
          id: personalTeamId,
          name: `${userName}'s Personal Workspace`,
          description: "Your personal workspace for individual content",
          ownerId: user.id,
          isPersonal: true,
          createdAt: now,
          updatedAt: now
        })
        .select()
        .single();

      if (createError) {
        console.error("Personal workspace creation error:", createError);
      } else {
        personalTeam = newPersonalTeam;
        
        // Update user's personal team ID
        await supabaseAdmin
          .from('users')
          .update({ personalTeamId: personalTeam.id })
          .eq('id', user.id);
      }
    }

    // Get teams where user is owner
    const { data: ownedTeams, error: ownedError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('ownerId', user.id)
      .order('createdAt', { ascending: false });

    if (ownedError) {
      console.error("Owned teams error:", ownedError);
      return NextResponse.json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch owned teams"), { status: 500 });
    }

    // Get teams where user is a member
    const { data: memberTeams, error: memberError } = await supabaseAdmin
      .from('teams')
      .select(`
        *,
        team_members!inner (
          role,
          status,
          userId
        )
      `)
      .eq('team_members.userId', user.id)
      .eq('team_members.status', 'ACTIVE')
      .order('createdAt', { ascending: false });

    if (memberError) {
      console.error("Member teams error:", memberError);
      return NextResponse.json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch member teams"), { status: 500 });
    }

    // Merge and deduplicate teams
    const allTeams = [...(ownedTeams || []), ...(memberTeams || [])];
    const uniqueTeams = allTeams.filter((team, index, self) => 
      index === self.findIndex(t => t.id === team.id)
    );

    const formattedTeams = uniqueTeams.map(team => ({
      id: team.id,
      name: team.name,
      description: team.description,
      isPersonal: team.isPersonal || false,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      ownerId: team.ownerId,
      isOwner: team.ownerId === user.id,
      role: team.ownerId === user.id ? 'OWNER' : 
          team.team_members?.[0]?.role || 'MEMBER'
    }));

    return NextResponse.json(createSuccessResponse({ data: formattedTeams }));
  } catch (error) {
    console.error("Teams fetch error:", error);
    return NextResponse.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch teams"),
      { status: 500 }
    );
  }
}
