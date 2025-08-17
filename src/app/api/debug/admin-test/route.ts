import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// List of admin email addresses
const ADMIN_EMAILS = [
  "kan077bct049@kec.edu.np", // Your email
  // Add more admin emails here
];

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const isAdmin = ADMIN_EMAILS.includes(session.user.email.toLowerCase());
  
  if (!isAdmin) {
    return NextResponse.json({ error: "Not admin" }, { status: 403 });
  }

  try {
    // Get basic user count
    const userCount = await prisma.user.count();
    
    // Get all users with basic info
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        emailVerified: true,
        _count: {
          select: {
            ownedTeams: true,
            teamMembers: true,
            videos: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get detailed user info for first few users
    const detailedUsers = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
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

    return NextResponse.json({
      isAdmin: true,
      currentUser: session.user.email,
      userCount,
      allUsers: allUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        emailVerified: user.emailVerified,
        ownedTeams: user._count.ownedTeams,
        teamMembers: user._count.teamMembers,
        videos: user._count.videos,
      })),
      detailedUsers: detailedUsers.map(user => ({
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
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Admin test error:", error);
    return NextResponse.json({
      error: "Database error",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
