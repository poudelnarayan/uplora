import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { name, description } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
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

    // Create team
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description?.trim() || "",
        ownerId: user.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: team.id,
      name: team.name,
      description: team.description,
      owner: team.owner,
      memberCount: team._count.members,
      createdAt: team.createdAt,
    });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json([]);
    }

    // Get teams where user is owner or member
    const ownedTeams = await prisma.team.findMany({
      where: { ownerId: user.id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    const memberTeams = await prisma.teamMember.findMany({
      where: { userId: user.id },
      include: {
        team: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
    });

    // Format response
    const teams = [
      ...ownedTeams.map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        role: "OWNER" as const,
        owner: team.owner,
        memberCount: team._count.members + 1, // +1 for owner
        createdAt: team.createdAt,
      })),
      ...memberTeams.map((member) => ({
        id: member.team.id,
        name: member.team.name,
        description: member.team.description,
        role: member.role,
        owner: member.team.owner,
        memberCount: member.team._count.members + 1, // +1 for owner
        createdAt: member.team.createdAt,
      })),
    ];

    return NextResponse.json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}
