import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// Update member (pause/unpause)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ teamId: string; memberId: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const team = await prisma.team.findUnique({ where: { id: params.teamId } });
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    // Only owner can pause/unpause for now
    if (team.ownerId !== currentUser.id) {
      return NextResponse.json({ error: "Only owner can update members" }, { status: 403 });
    }

    const member = await prisma.teamMember.findUnique({ where: { id: params.memberId } });
    if (!member || member.teamId !== params.teamId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Prevent acting on owner
    if (member.userId === team.ownerId) {
      return NextResponse.json({ error: "Cannot modify the owner" }, { status: 400 });
    }

    const { status } = await request.json();
    if (!status || !["ACTIVE", "PAUSED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await prisma.teamMember.update({
      where: { id: params.memberId },
      data: { status },
      select: { id: true, status: true },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("Error updating member:", e);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

// Remove member
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ teamId: string; memberId: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const team = await prisma.team.findUnique({ where: { id: params.teamId } });
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    // Only owner can remove
    if (team.ownerId !== currentUser.id) {
      return NextResponse.json({ error: "Only owner can remove members" }, { status: 403 });
    }

    const member = await prisma.teamMember.findUnique({ where: { id: params.memberId } });
    if (!member || member.teamId !== params.teamId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Prevent removing owner
    if (member.userId === team.ownerId) {
      return NextResponse.json({ error: "Cannot remove the owner" }, { status: 400 });
    }

    await prisma.teamMember.delete({ where: { id: params.memberId } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error removing member:", e);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}


