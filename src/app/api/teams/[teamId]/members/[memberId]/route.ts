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

      // Load member
      const { data: member, error: memErr } = await supabaseAdmin
        .from('team_members')
        .select('id, userId, teamId')
        .eq('id', memberId)
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
        .eq('id', memberId);
      if (updErr) {
        return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to update member status");
      }

      broadcast({
        type: "team.member.updated",
        payload: { memberId, status: requestedStatus, teamId }
      });

      return createSuccessResponse({ id: memberId, status: requestedStatus });
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

      // Load member
      const { data: member, error: memErr } = await supabaseAdmin
        .from('team_members')
        .select('id, userId, teamId')
        .eq('id', memberId)
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
        .eq('id', memberId);
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
          const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.6;">
            <div style="max-width:600px;margin:0 auto;padding:20px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;">
              <h2 style="margin:0 0 12px;color:#111827;">Team Membership Update</h2>
              <p style="margin:0 0 8px;color:#334155;">You have been removed from <strong>${team.name}</strong>.</p>
              <p style="margin:0 0 12px;color:#64748b;font-size:14px;">If you believe this was a mistake, please contact the team administrator.</p>
            </div>
          </body></html>`;
          await sendMail({ to: removedUser.email, subject, text, html });
        }
      } catch (e) {
        // Log and continue
        console.error('Member removal email failed:', e);
      }

      // Broadcast member removal
      broadcast({
        type: "team.member.removed",
        payload: { memberId, teamId }
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