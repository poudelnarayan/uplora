import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id, email } = await request.json();
    if (!id && !email) {
      return NextResponse.json({ error: "Invitation id or email required" }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Ensure current user is team owner or admin/manager
    const team = await prisma.team.findUnique({ where: { id: params.teamId } });
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    if (team.ownerId !== currentUser.id) {
      const isPrivileged = await prisma.teamMember.findFirst({ where: { teamId: params.teamId, userId: currentUser.id, role: { in: ["ADMIN","MANAGER"] } } });
      if (!isPrivileged) return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const invite = await prisma.teamInvite.findFirst({
      where: {
        teamId: params.teamId,
        ...(id ? { id } : {}),
        ...(email ? { email } : {}),
        status: "PENDING",
      }
    });
    if (!invite) return NextResponse.json({ error: "Pending invitation not found" }, { status: 404 });

    await prisma.teamInvite.update({ where: { id: invite.id }, data: { status: "REJECTED" } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error cancelling invite:", e);
    return NextResponse.json({ error: "Failed to cancel invitation" }, { status: 500 });
  }
}


