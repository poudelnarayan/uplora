export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required"),
        { status: 401 }
      );
    }

    // Get user details from Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    const userName = clerkUser.fullName || clerkUser.firstName || "";
    const userImage = clerkUser.imageUrl || "";

    // Ensure user exists
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { 
        id: userId,
        email: userEmail || "", 
        name: userName, 
        image: userImage 
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
        err?.message ? { detail: String(err.message) } : undefined
      ),
      { status: 500 }
    );
  }
}

// Add POST method support for compatibility
export async function POST(req: NextRequest) {
  return DELETE(req);
}
