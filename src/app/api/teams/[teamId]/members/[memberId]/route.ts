export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";
import { withAuth, checkTeamAccess } from "@/lib/clerk-supabase-utils";
import { sendMail } from "@/lib/email";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";

// Update member (pause/unpause)
export async function PATCH(
  request: NextRequest,
  context: { params: { teamId: string; memberId: string } }
) {
  try {
    const { teamId, memberId } = context.params;
    const body = await request.json();
    const requestedStatus = body?.status;

    if (!requestedStatus || !["ACTIVE", "PAUSED"].includes(requestedStatus)) {
      return NextResponse.json(createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid status"), { status: 400 });
    }

    const result = await withAuth(async ({ supabaseUser }) => {
      // Check access
      const access = await checkTeamAccess(teamId, supabaseUser.id);
      if (!access.hasAccess || (access.role !== 'OWNER' && access.role !== 'ADMIN')) {
        return createErrorResponse(ErrorCodes.FORBIDDEN, "Insufficient permissions");
      }

      // Load team
      const { data: team, error: teamErr } = await supabaseAdmin
        .from('teams')
        .select('id, ownerId')
        .eq('id', teamId)
        .single();
      if (teamErr || !team) {
        return createErrorResponse(ErrorCodes.NOT_FOUND, "Team not found");
      }

      // Load member (memberId is userId in the UI)
      const { data: member, error: memErr } = await supabaseAdmin
        .from('team_members')
        .select('id, userId, teamId')
        .eq('teamId', teamId)
        .eq('userId', memberId)
        .single();
      if (memErr || !member || member.teamId !== teamId) {
        return createErrorResponse(ErrorCodes.NOT_FOUND, "Member not found");
      }

      // Prevent modifying owner
      if (member.userId === team.ownerId) {
        return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Cannot modify the owner");
      }

      const { error: updErr } = await supabaseAdmin
        .from('team_members')
        .update({ status: requestedStatus, updatedAt: new Date().toISOString() })
        .eq('teamId', teamId)
        .eq('userId', memberId);
      if (updErr) {
        return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to update member status");
      }

      broadcast({
        type: "team.member.updated",
        payload: { userId: memberId, status: requestedStatus, teamId }
      });

      return createSuccessResponse({ userId: memberId, status: requestedStatus });
    });

    const httpStatus = result.ok ? 200 : 403;
    return NextResponse.json(result, { status: httpStatus });
  } catch (e) {
    console.error("Error updating member:", e);
    return NextResponse.json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to update member"), { status: 500 });
  }
}

// Remove member
export async function DELETE(
  request: NextRequest,
  context: { params: { teamId: string; memberId: string } }
) {
  try {
    const { teamId, memberId } = context.params;
    const result = await withAuth(async ({ supabaseUser }) => {
      // Check access for current user
      const access = await checkTeamAccess(teamId, supabaseUser.id);
      if (!access.hasAccess || (access.role !== 'OWNER' && access.role !== 'ADMIN')) {
        return createErrorResponse(ErrorCodes.FORBIDDEN, "Insufficient permissions");
      }

      // Load team to check owner and name
      const { data: team, error: teamErr } = await supabaseAdmin
        .from('teams')
        .select('id, ownerId, name')
        .eq('id', teamId)
        .single();
      if (teamErr || !team) {
        return createErrorResponse(ErrorCodes.NOT_FOUND, "Team not found");
      }

      // Load member (memberId is userId in the UI)
      const { data: member, error: memErr } = await supabaseAdmin
        .from('team_members')
        .select('id, userId, teamId')
        .eq('teamId', teamId)
        .eq('userId', memberId)
        .single();
      if (memErr || !member || member.teamId !== teamId) {
        return createErrorResponse(ErrorCodes.NOT_FOUND, "Member not found");
      }

      // Prevent removing owner
      if (member.userId === team.ownerId) {
        return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Cannot remove the owner");
      }

      // Fetch removed user's email
      const { data: removedUser, error: userErr } = await supabaseAdmin
        .from('users')
        .select('email, name')
        .eq('id', member.userId)
        .single();

      // Delete membership
      const { error: delErr } = await supabaseAdmin
        .from('team_members')
        .delete()
        .eq('teamId', teamId)
        .eq('userId', memberId);
      if (delErr) {
        return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to remove member");
      }

      // Send notification email (best-effort)
      try {
        if (removedUser?.email) {
          const subject = `Removed from ${team.name} on Uplora`;
          const text = [
            `You've been removed from the team "${team.name}" on Uplora.`,
            '',
            `If you believe this was a mistake, please contact the team administrator.`,
          ].join("\n");
          const escapeHtml = (s: string) =>
            s
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
          const html = `<pre>${escapeHtml(text)}</pre>`;
          await sendMail({ to: removedUser.email, subject, text, html });
        }
      } catch (e) {
        // Log and continue
        console.error('Member removal email failed:', e);
      }

      // Broadcast member removal
      broadcast({
        type: "team.member.removed",
        payload: { userId: memberId, teamId }
      });

      return createSuccessResponse({ ok: true });
    });

    const httpStatus = result.ok ? 200 : 403;
    return NextResponse.json(result, { status: httpStatus });
  } catch (e) {
    console.error("Error removing member:", e);
    return NextResponse.json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to remove member"), { status: 500 });
  }
}