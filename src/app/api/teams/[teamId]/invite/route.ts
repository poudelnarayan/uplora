export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { withAuth, checkTeamAccess } from "@/lib/clerk-supabase-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { buildInviteUrl, generateInviteToken } from "@/lib/invitations";
import { broadcast } from "@/lib/realtime";
import { sendMail } from "@/lib/email";
import { sendInvitationEmail } from "@/lib/invitationEmail";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";

export async function POST(
  request: NextRequest,
  context: { params: { teamId: string } }
) {
  try {
    const { teamId } = context.params;

    const result = await withAuth(async ({ supabaseUser }) => {
      const { email, role, resend } = await request.json();

      if (!email || typeof email !== "string") {
        return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Email is required");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid email format");
      }

      if (!role || !["EDITOR", "MANAGER", "ADMIN"].includes(role)) {
        return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Valid role is required");
      }

      if ((supabaseUser.email || "").toLowerCase() === email.toLowerCase()) {
        return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "You cannot invite yourself");
      }

      const access = await checkTeamAccess(teamId, supabaseUser.id);
      if (!access.hasAccess || access.role !== "OWNER") {
        return createErrorResponse(ErrorCodes.FORBIDDEN, "Only the team owner can invite members");
      }

      const { data: userToInvite, error: userLookupError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      let existingMember = null;
      if (userToInvite && !userLookupError) {
        const { data: memberCheck, error: memberError } = await supabaseAdmin
          .from('team_members')
          .select('*')
          .eq('team_id', teamId)
          .eq('user_id', userToInvite.id)
          .single();

        if (memberError && memberError.code !== 'PGRST116') {
          return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to check team membership");
        }
        existingMember = memberCheck;
      }

      if (existingMember) {
        return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "User is already a team member");
      }

      const { data: existingInvite, error: inviteError } = await supabaseAdmin
        .from('team_invites')
        .select('*')
        .eq('team_id', teamId)
        .eq('email', email)
        .eq('status', 'PENDING')
        .single();

      if (inviteError && inviteError.code !== 'PGRST116') {
        return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to check existing invitations");
      }

      if (existingInvite) {
        if (resend) {
          const { error: updateError } = await supabaseAdmin
            .from('team_invites')
            .update({
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingInvite.id);

          if (updateError) {
            return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to resend invitation");
          }

          let emailSent = true;
          let emailError: string | null = null;
          let inviteUrl: string | null = null;
          try {
            await sendInvitationEmail(existingInvite.token, email, teamId, role);
            inviteUrl = buildInviteUrl(existingInvite.token);
          } catch (err) {
            const e = err as { message?: string };
            console.error("Resend email failed:", err);
            emailSent = false;
            emailError = e?.message || String(err);
            inviteUrl = buildInviteUrl(existingInvite.token);
          }

          return createSuccessResponse({
            message: emailSent ? "Invitation resent successfully" : `Resend failed: ${emailError}`,
            emailSent,
            emailError,
            inviteUrl,
            invitation: existingInvite
          });
        } else {
          return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Invitation already sent to this email");
        }
      }

      const token = generateInviteToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const inviteId = `invite-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      const { data: newInvite, error: createError } = await supabaseAdmin
        .from('team_invites')
        .insert({
          id: inviteId,
          email: email.toLowerCase(),
          role,
          token,
          expires_at: expiresAt,
          team_id: teamId,
          inviter_id: supabaseUser.id,
          status: 'PENDING',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating invitation:", createError);
        return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create invitation");
      }

      let emailSent = true;
      let emailError: string | null = null;
      let inviteUrl: string | null = null;
      try {
        await sendInvitationEmail(token, email, teamId, role);
        inviteUrl = buildInviteUrl(token);
      } catch (err) {
        const e = err as { message?: string; code?: string; response?: string };
        console.error("Invitation email failed:", err);
        emailSent = false;
        emailError = e?.message || String(err);
        inviteUrl = buildInviteUrl(token);
      }

      broadcast({ type: "team.invitation.sent", payload: { teamId, email, role } });

      return createSuccessResponse({
        message: emailSent ? "Invitation sent successfully" : `Invitation created but email delivery failed: ${emailError}`,
        emailSent,
        emailError,
        inviteUrl,
        invitation: newInvite
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
    console.error("Team invitation error:", error);
    return NextResponse.json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to send invitation"), { status: 500 });
  }
}

