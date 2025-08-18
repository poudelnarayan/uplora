import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { broadcast } from "@/lib/realtime";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);
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

    const updated = await prisma.teamInvite.update({ where: { id: invite.id }, data: { status: "REJECTED" } });
    broadcast({ type: "team.invite.cancelled", teamId: updated.teamId, payload: { id: updated.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error cancelling invitation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


