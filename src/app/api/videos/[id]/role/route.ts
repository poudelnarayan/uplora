import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });
    const { id } = context.params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    // If team video, resolve based on team ownership and membership
    if (video.teamId) {
      const team = await prisma.team.findUnique({ where: { id: video.teamId } });
      if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

      if (team.ownerId === user.id) {
        return NextResponse.json({ role: "OWNER", isOwner: true });
      }

      const membership = await prisma.teamMember.findFirst({
        where: { teamId: video.teamId, userId: user.id }
      });
      if (membership) {
        return NextResponse.json({ role: membership.role, isOwner: false });
      }

      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Personal video: uploader is the OWNER
    if (video.userId === user.id) {
      return NextResponse.json({ role: "PERSONAL_OWNER", isOwner: true });
    }

    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to get role" }, { status: 500 });
  }
}
