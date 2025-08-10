import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

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

    const { email, role } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!role || !["EDITOR", "MANAGER"].includes(role)) {
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

    // Check if user has permission to invite (owner or manager)
    const team = await prisma.team.findFirst({
      where: {
        id: params.teamId,
        OR: [
          { ownerId: currentUser.id },
          {
            members: {
              some: {
                userId: currentUser.id,
                role: "MANAGER",
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

    // Check if user is already a member or has pending invite
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

    const existingInvite = await prisma.teamInvite.findFirst({
      where: {
        teamId: params.teamId,
        email,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "User already has a pending invitation" },
        { status: 400 }
      );
    }

    // Create invitation
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const invitation = await prisma.teamInvite.create({
      data: {
        email,
        role,
        token,
        expiresAt,
        teamId: params.teamId,
        inviterId: currentUser.id,
      },
      include: {
        team: {
          select: {
            name: true,
          },
        },
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Send email invitation
    const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${invitation.token}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px); border-radius: 24px; padding: 32px; border: 1px solid rgba(255, 255, 255, 0.2); }
            .header { text-align: center; margin-bottom: 32px; }
            .logo { width: 64px; height: 64px; background: rgba(255, 255, 255, 0.1); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; color: #ef4444; font-size: 24px; }
            h1 { color: white; margin: 0; font-size: 24px; font-weight: bold; }
            .content { color: rgba(255, 255, 255, 0.9); line-height: 1.6; margin-bottom: 32px; }
            .team-info { background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; }
            .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 32px; border-radius: 50px; font-weight: 600; margin: 20px 0; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3); }
            .footer { text-align: center; color: rgba(255, 255, 255, 0.6); font-size: 14px; margin-top: 32px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">📺</div>
              <h1>You're Invited to Join a YouTube Team!</h1>
            </div>
            
            <div class="content">
              <p>Hi there!</p>
              
              <p><strong>${invitation.inviter.name}</strong> has invited you to join the <strong>"${team.name}"</strong> team on YTUploader.</p>
              
              <div class="team-info">
                <strong>Team:</strong> ${team.name}<br>
                <strong>Your Role:</strong> ${invitation.role}<br>
                <strong>Invited by:</strong> ${invitation.inviter.name} (${invitation.inviter.email})
              </div>
              
              <p>As a <strong>${invitation.role}</strong>, you'll be able to ${
                invitation.role === 'MANAGER' 
                  ? 'upload videos, manage team members, and invite new collaborators' 
                  : 'upload and manage videos for the team'
              }.</p>
              
              <div style="text-align: center;">
                <a href="${inviteUrl}" class="btn">Accept Invitation</a>
              </div>
              
              <p><small>This invitation will expire on ${invitation.expiresAt.toLocaleDateString()}. If you don't have an account, you'll be able to create one when you accept the invitation.</small></p>
            </div>
            
            <div class="footer">
              <p>YTUploader - Team YouTube Management</p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send the email
    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: `You're invited to join "${team.name}" on YTUploader`,
          text: `You've been invited to join the "${team.name}" team on YTUploader. Visit ${inviteUrl} to accept your invitation.`,
          html: emailHtml,
        }),
      });
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      // Continue anyway - invitation is created
    }

    return NextResponse.json({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      team: invitation.team,
      inviter: invitation.inviter,
    });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}
