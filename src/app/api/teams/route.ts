import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { broadcast } from "@/lib/realtime";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required"),
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Basic validation
    const { name, description } = body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Team name is required"),
        { status: 400 }
      );
    }

    // For now, we'll use the Clerk userId as our user ID
    // Later we can implement a proper user sync system
    const currentUser = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { 
        id: userId,
        email: "", // We'll get this from Clerk webhook later
        name: "" // We'll get this from Clerk webhook later
      },
    });

    // Check for duplicate team names for this user (optional validation)
    const existingTeam = await prisma.team.findFirst({
      where: { 
        ownerId: currentUser.id, 
        name: name.trim(),
        isPersonal: false // Only check non-personal teams
      }
    });
    
    if (existingTeam) {
      return NextResponse.json(
        createErrorResponse(
          ErrorCodes.DUPLICATE_ENTRY,
          "You already have a team with this name",
          { name: "Team name already exists" }
        ),
        { status: 400 }
      );
    }

    // Create new team (multiple teams allowed per owner)
    const team = await prisma.team.create({
      data: { 
        name: name.trim(), 
        description: description?.trim() || "", 
        ownerId: currentUser.id,
        isPersonal: false // Explicitly set as non-personal team
      },
    });

    // Realtime notify all connected clients to refresh team lists
    broadcast({
      type: "team.created",
      payload: { id: team.id, name: team.name, description: team.description },
    });

    return NextResponse.json(
      createSuccessResponse({ 
        id: team.id, 
        name: team.name, 
        description: team.description, 
        createdAt: team.createdAt 
      })
    );
  } catch (error) {
    console.error("Team creation error:", error);
    return NextResponse.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create team"),
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required"),
        { status: 401 }
      );
    }

    // Ensure a User row exists keyed by Clerk userId
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: "", name: "" },
    });

    // Ensure user has personal workspace
    let personalTeam = await prisma.team.findFirst({
      where: { ownerId: user.id, isPersonal: true }
    });
    
    if (!personalTeam) {
      // Create personal workspace if missing
      personalTeam = await prisma.team.create({
        data: {
          name: `Personal Workspace`,
          description: 'Your personal video workspace',
          ownerId: user.id,
          isPersonal: true
        }
      });
      
      // Update user with personal team reference
      await prisma.user.update({
        where: { id: user.id },
        data: { personalTeamId: personalTeam.id }
      });
    }

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

    return NextResponse.json(
      createSuccessResponse(teams.map(t => ({
        id: t.id, 
        name: t.name, 
        description: t.description, 
        createdAt: t.createdAt,
        isPersonal: t.isPersonal || false
      })))
    );
  } catch (error) {
    console.error("Teams API error:", error);
    return NextResponse.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch teams"),
      { status: 500 }
    );
  }
}
