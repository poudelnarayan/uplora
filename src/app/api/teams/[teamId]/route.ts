import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// PATCH: update team (owner-only)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const description = typeof body.description === "string" ? body.description.trim() : undefined;
    if (!name && !description) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const team = await prisma.team.findUnique({ where: { id: params.teamId } });
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    if (team.ownerId !== user.id) return NextResponse.json({ error: "Only the owner can update this team" }, { status: 403 });

    const updated = await prisma.team.update({
      where: { id: team.id },
      data: { ...(name ? { name } : {}), ...(description !== undefined ? { description } : {}) },
      select: { id: true, name: true, description: true, updatedAt: true },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}

// DELETE: delete team (owner-only)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const team = await prisma.team.findUnique({ where: { id: params.teamId } });
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    if (team.ownerId !== user.id) return NextResponse.json({ error: "Only the owner can delete this team" }, { status: 403 });

    await prisma.team.delete({ where: { id: team.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}


