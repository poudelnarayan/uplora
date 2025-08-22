export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Clear YouTube connection data
    await prisma.user.update({
      where: { id: userId },
      data: {
        youtubeAccessToken: null,
        youtubeRefreshToken: null,
        youtubeExpiresAt: null,
        youtubeChannelId: null,
        youtubeChannelTitle: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("YouTube disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect YouTube account" },
      { status: 500 }
    );
  }
}
