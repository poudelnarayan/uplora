import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = ["kan77bct049@kec.edu.np"]; 

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ADMIN_EMAILS.includes(session.user.email.toLowerCase())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { members: true, invites: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
      teams: teams.map(t => ({ id: t.id, name: t.name, memberCount: t._count.members, inviteCount: t._count.invites }))
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}


