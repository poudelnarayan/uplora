import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { name, description } = await request.json();
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    const currentUser = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {},
      create: { email: session.user.email, name: session.user.name || "", image: session.user.image || "" },
    });

    // Allow multiple teams per owner
    const team = await prisma.team.create({
      data: { name: name.trim(), description: description?.trim() || "", ownerId: currentUser.id },
    });

    return NextResponse.json({ id: team.id, name: team.name, description: team.description, createdAt: team.createdAt });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {},
      create: { email: session.user.email, name: session.user.name || "", image: session.user.image || "" },
    });

    // Find all teams where the user is owner OR member
    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    // Do not auto-create a default team. If none, return empty list.
    return NextResponse.json(teams.map(t => ({ id: t.id, name: t.name, description: t.description, createdAt: t.createdAt })));
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}
