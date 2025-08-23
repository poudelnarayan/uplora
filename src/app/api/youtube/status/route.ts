export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        youtubeAccessToken: true,
        youtubeChannelId: true,
        youtubeChannelTitle: true,
        youtubeExpiresAt: true,
      }
    });

    const isConnected = !!(user?.youtubeAccessToken && user?.youtubeChannelId);
    
    // Check if token is expired
    const isExpired = user?.youtubeExpiresAt && new Date() > user.youtubeExpiresAt;

    return NextResponse.json({
      isConnected: isConnected && !isExpired,
      channelTitle: user?.youtubeChannelTitle,
      channelId: user?.youtubeChannelId,
      isExpired,
    });
  } catch (error) {
    console.error("YouTube status error:", error);
    return NextResponse.json(
      { error: "Failed to get YouTube status" },
      { status: 500 }
    );
  }
}
