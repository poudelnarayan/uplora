export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.log("Role API: No userId found");
      return NextResponse.json({ error: "Auth required" }, { status: 401 });
    }
    
    const { id } = context.params;
    console.log(`Role API: Checking role for video ${id} by user ${userId}`);

    // Get user details from Clerk and sync with Supabase
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    const userName = clerkUser.fullName || clerkUser.firstName || "";
    const userImage = clerkUser.imageUrl || "";

    // Ensure user exists in Supabase
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
      console.error("Role API: User sync error:", userError);
      return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
    }

    const { data: video, error: videoError } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();

    if (videoError || !video) {
      console.log(`Role API: Video not found - ${id}`, videoError);
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    console.log(`Role API: Video found, teamId: ${video.teamId}`);

    // Personal workspace video (no team)
    if (!video.teamId) {
      const role = video.userId === user.id ? "PERSONAL_OWNER" : null;
      if (!role) return NextResponse.json({ error: "No access" }, { status: 403 });
      return NextResponse.json({ role });
    }

    // Team video. First check if user is the team owner (may not exist in team_members)
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', video.teamId)
      .single();

    if (teamError || !team) {
      console.log(`Role API: Team not found - ${video.teamId}`, teamError);
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.ownerId === user.id) {
      return NextResponse.json({ role: "OWNER" });
    }

    console.log(`Role API: Team found, checking membership for user ${user.id}`);

    // Otherwise, check team membership
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('team_members')
      .select('role')
      .eq('teamId', video.teamId)
      .eq('userId', user.id)
      .single();

    if (membershipError || !membership) {
      console.log(`Role API: User ${user.id} not a member of team ${video.teamId}`, membershipError);
      return NextResponse.json({ error: "Not a member of this team" }, { status: 403 });
    }

    console.log(`Role API: User role is ${membership.role}`);
    return NextResponse.json({ role: membership.role });
  } catch (e) {
    console.error("Role API: Unexpected error:", e);
    return NextResponse.json({ error: "Failed to get role" }, { status: 500 });
  }
}
