export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";
import { withTeamRole, TEAM_ROLES } from "@/lib/api-guards";

export const POST = withTeamRole(TEAM_ROLES.ADMINS, async (request, { teamId }) => {
  try {
    const { id, email } = await request.json();
    if (!id && !email) {
      return NextResponse.json(
        { error: "Invitation id or email required" },
        { status: 400 },
      );
    }

    let query = supabaseAdmin
      .from("team_invites")
      .select("*")
      .eq("team_id", teamId)
      .eq("status", "PENDING");

    if (id) {
      query = query.eq("id", id);
    } else if (email) {
      query = query.eq("email", email);
    }

    const { data: invite, error: inviteError } = await query.single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: "Pending invitation not found" },
        { status: 404 },
      );
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("team_invites")
      .update({ status: "REJECTED", updated_at: new Date().toISOString() })
      .eq("id", invite.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating invitation:", updateError);
      return NextResponse.json(
        { error: "Failed to cancel invitation" },
        { status: 500 },
      );
    }

    broadcast({
      type: "team.invite.cancelled",
      teamId: updated.team_id,
      payload: { id: updated.id },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error cancelling invitation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
