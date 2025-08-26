export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/clerk-supabase-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: { token: string } }
) {
  try {
    const { token } = context.params;
    
    const result = await withAuth(async ({ clerkUser, supabaseUser }) => {
      const userEmail = clerkUser.emailAddresses[0]?.emailAddress;

      // Find the invitation
      const { data: invitation, error: inviteError } = await supabaseAdmin
        .from('team_invites')
        .select(`
          *,
          teams (*)
        `)
        .eq('token', token)
        .eq('status', 'PENDING')
        .gt('expiresAt', new Date().toISOString())
        .single();

      if (inviteError || !invitation) {
        return createErrorResponse(ErrorCodes.NOT_FOUND, "Invitation not found or expired");
      }

      // Check if the email matches
      if (invitation.email !== userEmail) {
        return createErrorResponse(ErrorCodes.FORBIDDEN, "This invitation is not for your email address");
      }

      // Check if user is already a member
      const { data: existingMember, error: memberError } = await supabaseAdmin
        .from('team_members')
        .select('*')
        .eq('userId', supabaseUser.id)
        .eq('teamId', invitation.teamId)
        .single();

      if (memberError && memberError.code !== 'PGRST116') {
        console.error("Error checking existing membership:", memberError);
        return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to check team membership");
      }

      if (existingMember) {
        // Update invitation status
        const { error: updateError } = await supabaseAdmin
          .from('team_invites')
          .update({ status: 'ACCEPTED' })
          .eq('id', invitation.id);

        if (updateError) {
          console.error("Error updating invitation:", updateError);
        }

        return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "You are already a member of this team");
      }

      // If already member, mark invite accepted and return success
      if (existingMember) {
        const { error: updErr } = await supabaseAdmin
          .from('team_invites')
          .update({ status: 'ACCEPTED', inviteeId: supabaseUser.id, updatedAt: new Date().toISOString() })
          .eq('id', invitation.id);
        if (updErr) {
          console.error("Error updating invitation for existing member:", updErr);
        }

        return createSuccessResponse({
          message: "Invitation already accepted",
          team: {
            id: invitation.teamId,
            name: invitation.teams.name,
            description: invitation.teams.description
          }
        });
      }

      // Create membership
      const memberId = `tm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const nowIso = new Date().toISOString();

      const { error: insertMemberErr } = await supabaseAdmin
        .from('team_members')
        .insert({
          id: memberId,
          role: invitation.role,
          joinedAt: nowIso,
          updatedAt: nowIso,
          status: 'ACTIVE',
          userId: supabaseUser.id,
          teamId: invitation.teamId
        });

      if (insertMemberErr) {
        console.error("Error inserting team member:", insertMemberErr);
        return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to add you to the team");
      }

      // Mark invite accepted
      const { error: updateInviteErr } = await supabaseAdmin
        .from('team_invites')
        .update({ status: 'ACCEPTED', inviteeId: supabaseUser.id, updatedAt: nowIso })
        .eq('id', invitation.id);

      if (updateInviteErr) {
        console.error("Error updating invitation status:", updateInviteErr);
        // continue; membership already created
      }

      // Realtime notify team members
      broadcast({
        type: "team.member.joined",
        payload: { 
          teamId: invitation.teamId, 
          userId: supabaseUser.id,
          userName: clerkUser.fullName || clerkUser.firstName || "New Member"
        },
      });

      return createSuccessResponse({
        message: "Invitation accepted successfully",
        team: {
          id: invitation.teamId,
          name: invitation.teams.name,
          description: invitation.teams.description
        }
      });
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 401 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Invitation accept error:", error);
    return NextResponse.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to accept invitation"),
      { status: 500 }
    );
  }
}
