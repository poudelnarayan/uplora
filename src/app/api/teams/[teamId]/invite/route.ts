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

      // Prevent inviting oneself
      if ((supabaseUser.email || "").toLowerCase() === email.toLowerCase()) {
        return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "You cannot invite yourself");
      }

      // Check if user has permission to invite (owner, admin, or manager)
      const access = await checkTeamAccess(teamId, supabaseUser.id);
      if (!access.hasAccess || (access.role !== 'OWNER' && access.role !== 'ADMIN' && access.role !== 'MANAGER')) {
        return createErrorResponse(ErrorCodes.FORBIDDEN, "Insufficient permissions to invite members");
      }

      // Check if user is already a member by looking up the user first
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
          .eq('teamId', teamId)
          .eq('userId', userToInvite.id)
          .single();
        
        if (memberError && memberError.code !== 'PGRST116') {
          console.error("Error checking existing membership:", memberError);
          return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to check team membership");
        }
        
        existingMember = memberCheck;
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
        console.log(`📧 SMTP Config Check:`, {
          hasUser: !!process.env.SMTP_USER,
          hasPass: !!process.env.SMTP_PASS,
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: process.env.SMTP_SECURE
        });
        
        await sendInvitationEmail(token, email, teamId, role);
        console.log(`✅ Invitation email sent successfully to: ${email}`);
      } catch (emailError) {
        console.error("❌ INVITATION EMAIL SENDING FAILED:", emailError);
        console.error("📧 Email details:", { email, teamId, role, token });
        console.error("📧 SMTP Error details:", {
          message: emailError instanceof Error ? emailError.message : 'Unknown error',
          stack: emailError instanceof Error ? emailError.stack : undefined
        });
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

    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>You're invited to join ${team.name} • Uplora</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f6f8fb;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f6f8fb;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:24px 24px;">
                <h1 style="margin:0;font-size:22px;line-height:28px;color:#ffffff;">You're invited to join ${team.name}</h1>
                <p style="margin:6px 0 0 0;font-size:13px;line-height:18px;color:rgba(255,255,255,.9);">Uplora Team Workspace</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 24px 8px 24px;">
                <p style="margin:0 0 16px 0;font-size:15px;line-height:22px;color:#1f2937;">You have been invited to collaborate on Uplora.</p>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:0 0 20px 0;">
                  <tr>
                    <td style="padding:16px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="font-size:14px;color:#334155;">
                        <tr>
                          <td style="padding:4px 0;"><strong style="color:#111827;">Team:</strong> ${team.name}</td>
                        </tr>
                        <tr>
                          <td style="padding:4px 0;"><strong style="color:#111827;">Role:</strong> ${role}</td>
                        </tr>
                        ${team.description ? `<tr><td style="padding:4px 0;"><strong style="color:#111827;">Description:</strong> ${team.description}</td></tr>` : ''}
                        <tr>
                          <td style="padding:4px 0;"><strong style="color:#111827;">Expires:</strong> in 7 days</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <div style="text-align:center;margin:20px 0 8px 0;">
                  <a href="${inviteUrl}" style="background-color:#3b82f6;border-radius:8px;color:#ffffff;display:inline-block;font-weight:600;padding:12px 20px;text-decoration:none;">Accept Invitation</a>
                </div>
                <p style="margin:16px 0 0 0;font-size:12px;line-height:18px;color:#64748b;">If the button doesn’t work, copy and paste this URL into your browser:</p>
                <p style="margin:6px 0 0 0;font-size:12px;line-height:18px;color:#2563eb;word-break:break-all;">${inviteUrl}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px 24px 24px;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;line-height:18px;color:#94a3b8;">You received this email because someone invited you to a team on Uplora. If you weren’t expecting this, you can safely ignore it.</p>
              </td>
            </tr>
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;margin-top:12px;">
            <tr>
              <td align="center" style="font-size:11px;line-height:16px;color:#94a3b8;">© ${new Date().getFullYear()} Uplora • Team Video Management</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

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
