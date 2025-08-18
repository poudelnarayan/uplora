import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { broadcast } from "@/lib/realtime";
import { sendMail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { email, role, resend } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    // Server-side email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (!role || !["EDITOR", "MANAGER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Valid role is required" },
        { status: 400 }
      );
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to invite (owner, admin, or manager)
    const team = await prisma.team.findFirst({
      where: {
        id: params.teamId,
        OR: [
          { ownerId: currentUser.id },
          {
            members: {
              some: {
                userId: currentUser.id,
                role: { in: ["MANAGER", "ADMIN"] },
              },
            },
          },
        ],
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found or insufficient permissions" },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId: params.teamId,
        user: { email },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a team member" },
        { status: 400 }
      );
    }

    // Find any existing invite for this email/team (any status)
    let invitation = await prisma.teamInvite.findFirst({
      where: { teamId: params.teamId, email },
      include: {
        team: { select: { name: true } },
        inviter: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // If there is an existing pending and unexpired invite and not resend, block
    if (invitation && invitation.status === "PENDING" && invitation.expiresAt > new Date() && !resend) {
      return NextResponse.json(
        { error: "User already has a pending invitation" },
        { status: 400 }
      );
    }

    // Prepare email content before writing to DB
    const inviterName = currentUser.name || "";
    const inviterEmail = currentUser.email || "";
    const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${token}`;

    // Persist the invitation first, but roll back on email failure
    let createdNew = false;
    const previousSnapshot = invitation
      ? { token: invitation.token, expiresAt: invitation.expiresAt, status: invitation.status, inviterId: invitation.inviterId, role: invitation.role }
      : null;

    if (invitation) {
      invitation = await prisma.teamInvite.update({
        where: { id: invitation.id },
        data: { role, token, expiresAt, status: "PENDING", inviterId: currentUser.id },
        include: { team: { select: { name: true } }, inviter: { select: { name: true, email: true } } },
      });
    } else {
      createdNew = true;
      invitation = await prisma.teamInvite.create({
        data: { email, role, token, expiresAt, teamId: params.teamId, inviterId: currentUser.id },
        include: { team: { select: { name: true } }, inviter: { select: { name: true, email: true } } },
      });
    }

    // Try to send the email now
    try {
      await sendInviteEmail(invitation.team.name, inviterName, inviterEmail, email, role, inviteUrl, expiresAt);
      console.log(`✅ Invitation email sent successfully to ${email}`);
    } catch (e) {
      // Rollback DB change so we don't leave a pending invite without an email
      try {
        if (createdNew) {
          await prisma.teamInvite.delete({ where: { id: invitation.id } });
        } else if (previousSnapshot) {
          await prisma.teamInvite.update({
            where: { id: invitation.id },
            data: {
              token: previousSnapshot.token,
              expiresAt: previousSnapshot.expiresAt,
              status: previousSnapshot.status,
              inviterId: previousSnapshot.inviterId,
              role: previousSnapshot.role,
            },
          });
        }
      } catch (rollbackErr) {
        console.error("Failed to rollback invitation after email error:", rollbackErr);
      }
      return NextResponse.json({ 
        error: "Failed to send invitation email - please try again",
        emailSent: false,
        details: e instanceof Error ? e.message : "Email delivery failed"
      }, { status: 502 });
    }

    const resp = {
      id: invitation.id,
      token: invitation.token,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      team: invitation.team,
      inviter: invitation.inviter,
      emailSent: true,
      message: "Invitation sent successfully",
      reused: Boolean(previousSnapshot),
    };
    broadcast({ type: "team.invite", teamId: params.teamId, payload: { email, role } });
    return NextResponse.json(resp);
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}

async function sendInviteEmail(teamName: string, inviterName: string, inviterEmail: string, to: string, role: string, inviteUrl: string, expiresAt: Date) {
  const prettyDate = expiresAt.toLocaleDateString();
  const subject = `You're invited to join "${teamName}" on Uplora`;

  const emailText = [
    `You're invited to join ${teamName} on Uplora`,
    ``,
    `${inviterName || "A teammate"} (${inviterEmail || "noreply@uplora.io"}) invited you to join "${teamName}" as a ${role}.`,
    ``,
    `Accept your invitation: ${inviteUrl}`,
    ``,
    `This invitation expires on ${prettyDate}. If you didn't expect this email, you can safely ignore it.`,
    ``,
    `— Uplora`
  ].join("\n");

  const safeTeam = teamName.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeInviter = (inviterName || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeInviterEmail = (inviterEmail || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeRole = role.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;background:#f6f9fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="width:100%;padding:24px;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(15,23,42,0.04);overflow:hidden;">
      <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;padding:24px;">
        <h1 style="margin:0;font-size:24px;">Team Invitation</h1>
        <p style="margin:8px 0 0;opacity:0.9;">Uplora</p>
      </div>
      <div style="padding:24px;">
        <h2 style="color:#1e293b;margin:0 0 16px;">You're invited to join "${safeTeam}"</h2>
        <p style="color:#475569;margin:0 0 16px;"><strong>${safeInviter || "A teammate"}</strong> ${safeInviterEmail ? `&lt;${safeInviterEmail}&gt;` : ""} invited you to join the team as <strong>${safeRole}</strong>.</p>
        <div style="background:#dbeafe;border:1px solid #93c5fd;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:4px 0;"><strong>Team:</strong> ${safeTeam}</p>
          <p style="margin:4px 0;"><strong>Role:</strong> ${safeRole}</p>
          <p style="margin:4px 0;color:#64748b;font-size:13px;">Expires: ${prettyDate}</p>
        </div>
        <div style="text-align:center;margin:20px 0;">
          <a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Accept Invitation</a>
        </div>
        <p style="color:#64748b;font-size:13px;margin:16px 0;">Or copy this link: ${inviteUrl}</p>
        <p style="color:#64748b;font-size:13px;">If you didn't expect this email, you can safely ignore it.</p>
      </div>
      <div style="padding:16px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:12px;">
        © ${new Date().getFullYear()} Uplora. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>`;

  try {
    await sendMail({ to, subject, text: emailText, html: emailHtml });
    return true;
  } catch (e) {
    console.error("Failed to send invitation email:", e);
    throw e;
  }
}
