export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Auth required" }, { status: 401 });
    }

    // Ensure user exists
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
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

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("lock release error", e);
    return NextResponse.json({ 
      error: "Failed to release lock", 
      detail: err?.message 
    }, { status: 500 });
  }
}
