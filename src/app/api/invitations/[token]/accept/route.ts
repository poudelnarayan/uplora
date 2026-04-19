export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/clerk-supabase-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";

export async function POST(
  request: NextRequest,
  context: { params: { token: string } }
) {
  try {
    const { token } = context.params;

    const result = await withAuth(async ({ clerkUser, supabaseUser }) => {
      const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
      const normalizedUserEmail = (userEmail || "").trim().toLowerCase();

      const { data: invitation, error: inviteError } = await supabaseAdmin
        .from('team_invites')
        .select(`*, teams (*)`)
        .eq('token', token)
        .eq('status', 'PENDING')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (inviteError || !invitation) {
        return createErrorResponse(ErrorCodes.NOT_FOUND, "Invitation not found or expired");
      }

      if ((invitation.email || "").toLowerCase() !== normalizedUserEmail) {
        return createErrorResponse(ErrorCodes.FORBIDDEN, "This invitation is not for your email address");
      }

      const { data: existingMember, error: memberError } = await supabaseAdmin
        .from('team_members')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .eq('team_id', invitation.team_id)
        .single();

      if (memberError && memberError.code !== 'PGRST116') {
        return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to check team membership");
      }

      if (existingMember) {
        await supabaseAdmin
          .from('team_invites')
          .update({ status: 'ACCEPTED', invitee_id: supabaseUser.id, updated_at: new Date().toISOString() })
          .eq('id', invitation.id);

        try { broadcast({ type: "team.invitation.accepted", teamId: invitation.team_id, payload: { email: invitation.email } }); } catch {}
        return createSuccessResponse({
          message: "Invitation already accepted",
          team: { id: invitation.team_id, name: invitation.teams.name, description: invitation.teams.description }
        });
      }

      const memberId = `tm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const nowIso = new Date().toISOString();

      const { error: insertMemberErr } = await supabaseAdmin
        .from('team_members')
        .insert({
          id: memberId,
          role: invitation.role,
          joined_at: nowIso,
          updated_at: nowIso,
          status: 'ACTIVE',
          user_id: supabaseUser.id,
          team_id: invitation.team_id
        });

      if (insertMemberErr) {
        console.error("Error inserting team member:", insertMemberErr);
        return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to add you to the team");
      }

      await supabaseAdmin
        .from('team_invites')
        .update({ status: 'ACCEPTED', invitee_id: supabaseUser.id, updated_at: nowIso })
        .eq('id', invitation.id);

      broadcast({
        type: "team.member.joined",
        payload: {
          teamId: invitation.team_id,
          userId: supabaseUser.id,
          userName: clerkUser.fullName || clerkUser.firstName || "New Member"
        },
      });
      try { broadcast({ type: "team.invitation.accepted", teamId: invitation.team_id, payload: { email: invitation.email } }); } catch {}

      return createSuccessResponse({
        message: "Invitation accepted successfully",
        team: { id: invitation.team_id, name: invitation.teams.name, description: invitation.teams.description }
      });
    });

    if (!result.ok) {
      const status =
        result.code === ErrorCodes.UNAUTHORIZED ? 401 :
        result.code === ErrorCodes.FORBIDDEN ? 403 :
        result.code === ErrorCodes.NOT_FOUND ? 404 :
        result.code === ErrorCodes.VALIDATION_ERROR ? 400 : 500;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Invitation accept error:", error);
    return NextResponse.json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to accept invitation"), { status: 500 });
  }
}
