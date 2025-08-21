import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession();

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Ensure user has access (owner or is member)
    const team = await prisma.team.findFirst({
      where: {
        id: params.teamId,
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    if (!team) return NextResponse.json({ error: "Team not found or no access" }, { status: 404 });

    const members = await prisma.teamMember.findMany({
      where: { teamId: params.teamId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { joinedAt: "asc" },
    });

    const invites = await prisma.teamInvite.findMany({
      where: { teamId: params.teamId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        owner: team.owner,
        createdAt: team.createdAt,
      },
      members: members.map(m => ({
        id: m.id,
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
      invites,
    });
  } catch (e) {
    console.error("Error fetching team details:", e);
    return NextResponse.json({ error: "Failed to fetch team details" }, { status: 500 });
  }
}
