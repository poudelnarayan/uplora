export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

// Current user leaves the team (cannot be owner)
export async function DELETE(
  request: NextRequest,
  context: { params: { teamId: string } }
) {
  try {
    const { teamId } = context.params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    if (team.ownerId === user.id) {
      return NextResponse.json({ error: "Owner cannot leave their own team" }, { status: 403 });
    }

    const member = await prisma.teamMember.findFirst({ where: { teamId, userId: user.id } });
    if (!member) return NextResponse.json({ error: "You are not a member of this team" }, { status: 404 });

    await prisma.teamMember.delete({ where: { id: member.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to leave team" }, { status: 500 });
  }
}


