export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Auth required" }, { status: 401 });
    }

    const { key } = await req.json();
    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
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

    // Release upload lock for this user
    await prisma.uploadLock.deleteMany({
      where: { userId: user.id }
    });

    // Mark video as uploaded
    await prisma.video.updateMany({
      where: { 
        key: key,
        userId: user.id
      },
      data: { 
        status: "uploaded",
        uploadedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("put complete error", e);
    return NextResponse.json({ 
      error: "Failed to complete upload", 
      detail: err?.message 
    }, { status: 500 });
  }
}
