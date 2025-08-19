import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { broadcast } from "@/lib/realtime";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/validation";
import { teamCreateSchema, handleZodError } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required"),
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input using Zod
    const validationResult = teamCreateSchema.safeParse(body);
    if (!validationResult.success) {
      const errorResponse = handleZodError(validationResult.error);
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { name, description } = validationResult.data;

    const currentUser = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {},
      create: { email: session.user.email, name: session.user.name || "", image: session.user.image || "" },
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
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required"),
        { status: 401 }
      );
    }

    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {},
      create: { email: session.user.email, name: session.user.name || "", image: session.user.image || "" },
    });

    // Ensure user has personal workspace
    let personalTeam = await prisma.team.findFirst({
      where: { ownerId: user.id, isPersonal: true }
    });
    
    if (!personalTeam) {
      // Create personal workspace if missing
      personalTeam = await prisma.team.create({
        data: {
          name: `${user.name || 'Personal'}'s Workspace`,
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
