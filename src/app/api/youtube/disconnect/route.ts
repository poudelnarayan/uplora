import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { userId } = auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Clear YouTube connection data
    await prisma.user.update({
      where: { id: session.user.id },
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
