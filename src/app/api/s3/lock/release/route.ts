export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required"),
        { status: 401 }
      );
    }

    // Ensure user exists
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { 
        email: session.user.email, 
        name: session.user.name || "", 
        image: session.user.image || "" 
      },
    });

    // Release any upload lock for this user
    await prisma.uploadLock.deleteMany({
      where: { userId: user.id }
    });

    return NextResponse.json(createSuccessResponse({ success: true }));
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("lock release error", e);
    return NextResponse.json(
      createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        "Failed to release lock",
        undefined,
        err?.message
      ),
      { status: 500 }
    );
  }
}

// Add POST method support for compatibility
export async function POST(req: NextRequest) {
  return DELETE(req);
}
