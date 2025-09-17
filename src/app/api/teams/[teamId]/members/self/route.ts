export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

// Current user leaves the team (cannot be owner)
export async function DELETE(
  request: NextRequest,
  context: { params: { teamId: string } }
) {
  try {
    const { teamId } = context.params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

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
      console.error("User sync error:", userError);
      return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
    }

    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.ownerId === user.id) {
      return NextResponse.json({ error: "Owner cannot leave their own team" }, { status: 403 });
    }

    const { data: member, error: memberError } = await supabaseAdmin
      .from('teamMembers')
      .select('*')
      .eq('teamId', teamId)
      .eq('userId', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: "You are not a member of this team" }, { status: 404 });
    }

    await supabaseAdmin
      .from('teamMembers')
      .delete()
      .eq('id', member.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to leave team" }, { status: 500 });
  }
}


