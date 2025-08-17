import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// List of admin email addresses (credentials-only)
const ADMIN_EMAILS = [
  "kan77bct049@kec.edu.np",
];

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = ADMIN_EMAILS.includes(session.user.email.toLowerCase());
  
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        emailVerified: true,
        ownedTeams: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                members: true,
                invites: true,
              }
            }
          }
        },
        teamMembers: {
          select: {
            team: {
              select: {
                id: true,
                name: true,
                _count: {
                  select: {
                    members: true,
                    invites: true,
                  }
                }
              }
            },
            role: true,
          }
        },
        videos: {
          select: {
            id: true,
            filename: true,
            status: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to match the frontend interface
    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
      ownedTeams: user.ownedTeams.map(team => ({
        id: team.id,
        name: team.name,
        memberCount: team._count.members,
        inviteCount: team._count.invites,
      })),
      teamMembers: user.teamMembers.map(member => ({
        team: {
          id: member.team.id,
          name: member.team.name,
          memberCount: member.team._count.members,
          inviteCount: member.team._count.invites,
        },
        role: member.role,
      })),
      videos: user.videos,
    }));

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
