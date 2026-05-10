export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/clerk-supabase-utils";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";
import { broadcast } from "@/lib/realtime";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await safeAuth();
    if (!userId) {
      return NextResponse.json(createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required"), { status: 401 });
    }

    const userInfo = await currentUser();
    if (!userInfo) {
      return NextResponse.json(createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required"), { status: 401 });
    }
    const userEmail = userInfo.emailAddresses?.[0]?.emailAddress || "";
    const userName = userInfo.fullName || userInfo.firstName || "";
    const userImage = userInfo.imageUrl || "";

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Server configuration error. Please set Supabase URL and Service Role key."),
        { status: 500 }
      );
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        clerk_id: userId,
        email: userEmail || "",
        name: userName,
        image: userImage,
        updated_at: new Date().toISOString()
      }, { onConflict: 'clerk_id' })
      .select()
      .single();

    if (userError) {
      console.error("User sync error:", userError);
      return NextResponse.json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to sync user"), { status: 500 });
    }

    const body = await request.json();
    const { name, description, enabledPlatforms } = body as {
      name?: string;
      description?: string;
      enabledPlatforms?: string[];
    };
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Team name is required"), { status: 400 });
    }

    const VALID_PLATFORMS = new Set([
      'youtube','instagram','facebook','twitter','linkedin','pinterest','threads','tiktok','telegram',
    ]);
    const cleanPlatforms = Array.isArray(enabledPlatforms)
      ? Array.from(new Set(enabledPlatforms.filter((p) => typeof p === 'string' && VALID_PLATFORMS.has(p))))
      : [];

    const { data: existingTeam, error: checkError } = await supabaseAdmin
      .from('teams')
      .select('id')
      .eq('owner_id', user.id)
      .eq('name', name.trim())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to check existing teams"), { status: 500 });
    }

    if (existingTeam) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "You already have a team with this name", { name: "Team name already exists" }),
        { status: 400 }
      );
    }

    const teamId = `team-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();
    const { data: team, error: createError } = await supabaseAdmin
      .from('teams')
      .insert({
        id: teamId,
        name: name.trim(),
        description: description?.trim() || "",
        owner_id: user.id,
        is_personal: false,
        enabled_platforms: cleanPlatforms,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (createError) {
      console.error("Supabase error:", createError);
      return NextResponse.json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create team"), { status: 500 });
    }

    const memberId = `tm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const { error: memberError } = await supabaseAdmin
      .from('team_members')
      .upsert({
        id: memberId,
        team_id: team.id,
        user_id: user.id,
        role: 'OWNER',
        status: 'ACTIVE',
        joined_at: now,
        updated_at: now
      }, { onConflict: 'team_id,user_id' });

    if (memberError) {
      console.error("Failed to add owner as team member:", memberError);
    }

    broadcast({ type: "team.created", payload: { id: team.id, name: team.name, description: team.description } });

    return NextResponse.json(createSuccessResponse({
      data: {
        id: team.id,
        name: team.name,
        description: team.description,
        createdAt: team.created_at,
        isPersonal: false,
        isOwner: true,
        role: 'OWNER',
        enabledPlatforms: Array.isArray((team as any).enabled_platforms) ? (team as any).enabled_platforms : cleanPlatforms,
      }
    }));
  } catch (error) {
    console.error("Team creation error:", error);
    return NextResponse.json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create team"), { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await safeAuth();
    if (!userId) {
      return NextResponse.json(createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required"), { status: 401 });
    }

    const userInfo = await currentUser();
    if (!userInfo) {
      return NextResponse.json(createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required"), { status: 401 });
    }
    const userEmail = userInfo.emailAddresses?.[0]?.emailAddress || "";
    const userName = userInfo.fullName || userInfo.firstName || "";
    const userImage = userInfo.imageUrl || "";

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Server configuration error. Please set Supabase URL and Service Role key."),
        { status: 500 }
      );
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        clerk_id: userId,
        email: userEmail || "",
        name: userName,
        image: userImage,
        updated_at: new Date().toISOString()
      }, { onConflict: 'clerk_id' })
      .select()
      .single();

    if (userError) {
      console.error("User sync error:", userError);
      return NextResponse.json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to sync user"), { status: 500 });
    }

    // Ensure personal workspace exists
    let { data: personalTeam, error: personalError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_personal', true)
      .single();

    if (personalError && personalError.code === 'PGRST116') {
      const personalTeamId = `personal-${user.id}`;
      const now = new Date().toISOString();
      const { data: newPersonalTeam, error: createError } = await supabaseAdmin
        .from('teams')
        .insert({
          id: personalTeamId,
          name: `${userName}'s Personal Workspace`,
          description: "Your personal workspace for individual content",
          owner_id: user.id,
          is_personal: true,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();

      if (createError) {
        console.error("Personal workspace creation error:", createError);
      } else {
        personalTeam = newPersonalTeam;
        await supabaseAdmin
          .from('users')
          .update({ personal_team_id: personalTeam.id })
          .eq('id', user.id);
      }
    }

    const { data: ownedTeams, error: ownedError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (ownedError) {
      return NextResponse.json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch owned teams"), { status: 500 });
    }

    const { data: memberTeams, error: memberError } = await supabaseAdmin
      .from('teams')
      .select(`*, team_members!inner (role, status, user_id)`)
      .eq('team_members.user_id', user.id)
      .order('created_at', { ascending: false });

    if (memberError) {
      console.error("Member teams error:", memberError);
      return NextResponse.json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch member teams"), { status: 500 });
    }

    const allTeams = [...(ownedTeams || []), ...(memberTeams || [])];
    const uniqueTeams = allTeams.filter((team, index, self) => index === self.findIndex(t => t.id === team.id));

    const teamIds = uniqueTeams.map(t => t.id).filter(Boolean);
    const membersByTeamId = new Map<string, Array<{ id: string; name: string; email: string; role: string; avatar: string }>>();

    if (teamIds.length > 0) {
      const { data: memberRows, error: membersError } = await supabaseAdmin
        .from("team_members")
        .select(`team_id, role, status, user_id, users (id, name, email, image)`)
        .in("team_id", teamIds);

      if (membersError) {
        console.error("Team members fetch error:", membersError);
      } else {
        for (const row of memberRows || []) {
          const status = String((row as any).status || "").toUpperCase();
          if (status !== "ACTIVE") continue;
          const teamId = (row as any).team_id as string;
          const u = (row as any).users || {};
          const list = membersByTeamId.get(teamId) || [];
          list.push({
            id: String((row as any).user_id || u.id || ""),
            name: String(u.name || ""),
            email: String(u.email || ""),
            role: String((row as any).role || "MEMBER"),
            avatar: String(u.image || ""),
          });
          membersByTeamId.set(teamId, list);
        }
      }
    }

    const formattedTeams = uniqueTeams.map(team => {
      const members_data = membersByTeamId.get(team.id) || [];
      const activeMembership = Array.isArray((team as any).team_members)
        ? (team as any).team_members.find((m: any) => String(m?.status || "").toUpperCase() === "ACTIVE")
        : null;
      return {
        id: team.id,
        name: team.name,
        description: team.description,
        isPersonal: team.is_personal || false,
        createdAt: team.created_at,
        updatedAt: team.updated_at,
        ownerId: team.owner_id,
        isOwner: team.owner_id === user.id,
        role: team.owner_id === user.id ? 'OWNER' :
          activeMembership?.role || (team as any).team_members?.[0]?.role || 'MEMBER',
        members_data,
        memberCount: members_data.length,
        enabledPlatforms: Array.isArray((team as any).enabled_platforms) ? (team as any).enabled_platforms : [],
      };
    });

    return NextResponse.json(createSuccessResponse({ data: formattedTeams }));
  } catch (error) {
    console.error("Teams fetch error:", error);
    return NextResponse.json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch teams"), { status: 500 });
  }
}
