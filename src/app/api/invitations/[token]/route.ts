import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const params = await context.params;
    const invitation = await prisma.teamInvite.findFirst({
      where: {
        token: params.token,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: {
        team: {
          select: {
            name: true,
            description: true,
          },
        },
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { message: "Invitation not found or expired" },
        { status: 404 }
      );
    }

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
