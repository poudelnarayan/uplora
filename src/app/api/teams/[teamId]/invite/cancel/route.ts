export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: { teamId: string } }
) {
  try {
    const { teamId } = context.params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id, email } = await request.json();
    if (!id && !email) {
      return NextResponse.json({ error: "Invitation id or email required" }, { status: 400 });
    }

    // Get user details from Clerk and sync with Supabase
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    const userName = clerkUser.fullName || clerkUser.firstName || "";
    const userImage = clerkUser.imageUrl || "";

    // Ensure user exists in Supabase
    const { data: currentUser, error: userError } = await supabaseAdmin
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

    // Ensure current user is team owner or admin/manager
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.ownerId !== currentUser.id) {
      const { data: isPrivileged, error: privilegeError } = await supabaseAdmin
        .from('teamMembers')
        .select('*')
        .eq('teamId', teamId)
        .eq('userId', currentUser.id)
        .in('role', ['ADMIN', 'MANAGER'])
        .single();

      if (privilegeError || !isPrivileged) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }
    }

    // Build query for finding the invitation
    let query = supabaseAdmin
      .from('teamInvites')
      .select('*')
      .eq('teamId', teamId)
      .eq('status', 'PENDING');

    if (id) {
      query = query.eq('id', id);
    } else if (email) {
      query = query.eq('email', email);
    }

    const { data: invite, error: inviteError } = await query.single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Pending invitation not found" }, { status: 404 });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('teamInvites')
      .update({ status: 'REJECTED', updatedAt: new Date().toISOString() })
      .eq('id', invite.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating invitation:", updateError);
      return NextResponse.json({ error: "Failed to cancel invitation" }, { status: 500 });
    }

    broadcast({ type: "team.invite.cancelled", teamId: updated.teamId, payload: { id: updated.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error cancelling invitation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


