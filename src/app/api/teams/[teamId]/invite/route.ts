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
      return NextResponse.json({ error: "Failed to send invitation email" }, { status: 502 });
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
  <style>
    body { margin:0; background:#f6f9fc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color:#0f172a; }
    .container { width:100%; padding:24px; }
    .card { max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 2px 8px rgba(15,23,42,0.04); overflow:hidden; }
    .header { padding:24px; border-bottom:1px solid #e2e8f0; background:linear-gradient(180deg,#ffffff, #f8fafc); }
    .brand { font-weight:800; letter-spacing:-0.01em; color:#111827; font-size:14px; }
    .content { padding:24px; }
    h1 { margin:0 0 8px; font-size:20px; color:#111827; }
    p { margin:0 0 12px; color:#334155; line-height:1.6; }
    .details { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin:16px 0; }
    .muted { color:#64748b; font-size:13px; }
    .cta { display:inline-block; padding:12px 18px; background:#2563eb; color:#ffffff !important; text-decoration:none; border-radius:10px; font-weight:600; }
    .cta:hover { background:#1d4ed8; }
    .footer { padding:16px 24px; border-top:1px solid #e2e8f0; background:#ffffff; color:#64748b; font-size:12px; }
    .spacer { height:8px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
    @media (prefers-color-scheme: dark) {
      body { background:#0b1220; color:#e5e7eb; }
      .card { background:#0f172a; border-color:#1f2937; box-shadow:0 2px 8px rgba(0,0,0,0.4); }
      .header { background:linear-gradient(180deg,#111827,#0f172a); border-color:#1f2937; }
      .brand { color:#e5e7eb; }
      h1 { color:#f8fafc; }
      p, .muted { color:#cbd5e1; }
      .details { background:#0b1220; border-color:#1f2937; }
      .footer { background:#0f172a; border-color:#1f2937; color:#94a3b8; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="brand">Uplora</div>
      </div>
      <div class="content">
        <h1>You're invited to join "${safeTeam}"</h1>
        <p><strong>${safeInviter || "A teammate"}</strong> ${safeInviterEmail ? `&lt;${safeInviterEmail}&gt;` : ""} invited you to join the team as <strong>${safeRole}</strong>.</p>
        <div class="details">
          <p><strong>Team</strong>: ${safeTeam}</p>
          <p><strong>Role</strong>: ${safeRole}</p>
          <p class="muted">This invitation expires on <span class="mono">${prettyDate}</span>.</p>
        </div>
        <p>Click the button below to accept and get started:</p>
        <p style="margin:16px 0 20px">
          <a class="cta" href="${inviteUrl}" target="_blank" rel="noopener">Accept Invitation</a>
        </p>
        <p class="muted">Or copy and paste this URL into your browser:</p>
        <p class="muted mono" style="word-break:break-all;">${inviteUrl}</p>
        <div class="spacer"></div>
        <p class="muted">If you didn’t expect this email, you can safely ignore it.</p>
      </div>
      <div class="footer">
        <div>© ${new Date().getFullYear()} Uplora. All rights reserved.</div>
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
