export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withAuth, checkTeamAccess } from "@/lib/clerk-supabase-utils";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";
import { buildInviteUrl, generateInviteToken } from "@/lib/invitations";
import { broadcast } from "@/lib/realtime";
import { sendMail } from "@/lib/email";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";

export const runtime = "nodejs";

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

      // Server-side email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid email format");
      }

      if (!role || !["EDITOR", "MANAGER", "ADMIN"].includes(role)) {
        return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Valid role is required");
      }

      // Check if user has permission to invite (owner, admin, or manager)
      const access = await checkTeamAccess(teamId, supabaseUser.id);
      if (!access.hasAccess || (access.role !== 'OWNER' && access.role !== 'ADMIN' && access.role !== 'MANAGER')) {
        return createErrorResponse(ErrorCodes.FORBIDDEN, "Insufficient permissions to invite members");
      }

      // Check if user is already a member
      const { data: existingMember, error: memberError } = await supabaseAdmin
        .from('team_members')
        .select(`
          *,
          users (email)
        `)
        .eq('teamId', teamId)
        .eq('users.email', email)
        .single();

      if (memberError && memberError.code !== 'PGRST116') {
        console.error("Error checking existing membership:", memberError);
        return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to check team membership");
      }

      if (existingMember) {
        return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "User is already a team member");
      }

      // Check for existing pending invitation
      const { data: existingInvite, error: inviteError } = await supabaseAdmin
        .from('team_invites')
        .select('*')
        .eq('teamId', teamId)
        .eq('email', email)
        .eq('status', 'PENDING')
        .single();

      if (inviteError && inviteError.code !== 'PGRST116') {
        console.error("Error checking existing invitation:", inviteError);
        return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to check existing invitations");
      }

      if (existingInvite) {
        if (resend) {
          // Resend existing invitation
          const { error: updateError } = await supabaseAdmin
            .from('team_invites')
            .update({ 
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date().toISOString()
            })
            .eq('id', existingInvite.id);

          if (updateError) {
            console.error("Error updating invitation:", updateError);
            return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to resend invitation");
          }

          // Send email
          let emailSent = true;
          try {
            await sendInvitationEmail(existingInvite.token, email, teamId, role);
          } catch (emailError) {
            console.error("Email resending failed:", emailError);
            emailSent = false;
          }

          return createSuccessResponse({
            message: emailSent ? "Invitation resent successfully" : "Resend failed - email delivery error",
            emailSent,
            invitation: existingInvite
          });
        } else {
          return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Invitation already sent to this email");
        }
      }

      // Create new invitation
      const token = generateInviteToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const inviteId = `invite-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      const { data: newInvite, error: createError } = await supabaseAdmin
        .from('team_invites')
        .insert({
          id: inviteId,
          email: email.toLowerCase(),
          role: role,
          token: token,
          expiresAt: expiresAt,
          teamId: teamId,
          inviterId: supabaseUser.id,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating invitation:", createError);
        return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create invitation");
      }

      // Send email
      let emailSent = true;
      try {
        console.log(`📧 Attempting to send invitation email to: ${email}`);
        console.log(`🔗 Team ID: ${teamId}, Role: ${role}, Token: ${token}`);
        await sendInvitationEmail(token, email, teamId, role);
        console.log(`✅ Invitation email sent successfully to: ${email}`);
      } catch (emailError) {
        console.error("❌ INVITATION EMAIL SENDING FAILED:", emailError);
        console.error("📧 Email details:", { email, teamId, role, token });
        emailSent = false;
      }

      // Realtime notify team members
      broadcast({
        type: "team.invitation.sent",
        payload: { 
          teamId: teamId, 
          email: email,
          role: role
        },
      });

      return createSuccessResponse({
        message: emailSent ? "Invitation sent successfully" : "Invitation created but email delivery failed",
        emailSent,
        invitation: newInvite
      });
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 401 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Team invitation error:", error);
    return NextResponse.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to send invitation"),
      { status: 500 }
    );
  }
}

export async function sendInvitationEmail(token: string, email: string, teamId: string, role: string) {
  try {
    console.log(`🎯 sendInvitationEmail called with:`, { token, email, teamId, role });
    
    // Get team details
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('name, description')
      .eq('id', teamId)
      .single();

    if (teamError) {
      console.error("❌ Error fetching team details:", teamError);
      throw new Error(`Failed to fetch team details: ${teamError.message}`);
    }

    if (!team) {
      console.error("❌ Team not found:", teamId);
      throw new Error(`Team not found: ${teamId}`);
    }

    console.log(`📋 Team details found:`, { name: team.name, description: team.description });

    const inviteUrl = buildInviteUrl(token);
    
    const subject = `You're invited to join ${team.name} on Uplora`;
    const text = [
      `You've been invited to join the team "${team.name}" on Uplora!`,
      "",
      `Role: ${role}`,
      `Team: ${team.name}`,
      team.description ? `Description: ${team.description}` : "",
      "",
      `Click the link below to accept the invitation:`,
      inviteUrl,
      "",
      `This invitation expires in 7 days.`,
      "",
      `Best regards,`,
      `The Uplora Team`
    ].join("\n");

    const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.6;">
      <div style="max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;padding:20px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:24px;">🎉 Team Invitation</h1>
          <p style="margin:8px 0 0;opacity:0.9;">Uplora</p>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
          <h2 style="margin:0 0 16px;color:#1f2937;">You're invited to join <strong>${team.name}</strong></h2>
          <div style="background:#f0f9ff;border:1px solid #0ea5e9;border-radius:8px;padding:16px;margin-bottom:20px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px;">
              <div><strong>Team:</strong> ${team.name}</div>
              <div><strong>Role:</strong> ${role}</div>
              ${team.description ? `<div><strong>Description:</strong> ${team.description}</div>` : ''}
            </div>
          </div>
          <div style="text-align:center;margin:24px 0;">
            <a href="${inviteUrl}" style="background:#3b82f6;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:500;display:inline-block;">Accept Invitation</a>
          </div>
          <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
            <p>This invitation expires in 7 days. If you have any questions, please contact your team administrator.</p>
          </div>
        </div>
      </div>
    </body></html>`;

    console.log(`📧 Sending invitation email to: ${email}`);
    console.log(`📬 Subject: ${subject}`);
    console.log(`🔗 Invite URL: ${inviteUrl}`);
    
    const emailResult = await sendMail({
      to: email,
      subject,
      text,
      html,
    });

    console.log(`✅ Invitation email sent successfully to ${email}:`, emailResult);
    return emailResult;
  } catch (error) {
    console.error(`❌ Failed to send invitation email to ${email}:`, error);
    throw error; // Re-throw to properly handle in calling function
  }
}
