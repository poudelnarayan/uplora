import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { broadcast } from "@/lib/realtime";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Find the invitation
    const invitation = await prisma.teamInvite.findFirst({
      where: {
        token: params.token,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: {
        team: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { message: "Invitation not found or expired" },
        { status: 404 }
      );
    }

    // Check if the email matches
    if (invitation.email !== session.user.email) {
      return NextResponse.json(
        { message: "This invitation is not for your email address" },
        { status: 403 }
      );
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || "",
          image: session.user.image || "",
        },
      });
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        userId: user.id,
        teamId: invitation.teamId,
      },
    });

    if (existingMember) {
      // Update invitation status
      await prisma.teamInvite.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      });

      return NextResponse.json(
        { message: "You are already a member of this team" },
        { status: 400 }
      );
    }

    // Add user to team and update invitation
    await prisma.$transaction([
      prisma.teamMember.create({
        data: {
          userId: user.id,
          teamId: invitation.teamId,
          role: invitation.role,
        },
      }),
      prisma.teamInvite.update({
        where: { id: invitation.id },
        data: { 
          status: "ACCEPTED",
          inviteeId: user.id,
        },
      }),
    ]);
    broadcast({ type: "team.member.added", teamId: invitation.teamId, payload: { userId: user.id } });

    return NextResponse.json({
      message: "Successfully joined the team!",
      team: invitation.team,
      role: invitation.role,
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
