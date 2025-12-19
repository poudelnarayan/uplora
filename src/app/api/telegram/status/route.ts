export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSocialConnections } from "@/server/services/socialConnections";

export async function GET(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ isConnected: false }, { status: 401 });

  const social = await getUserSocialConnections(userId);
  const tg = social.telegram;
  const isConnected = !!tg?.chatId;
  return NextResponse.json({
    isConnected,
    username: tg?.username ?? null,
    connectedAt: tg?.connectedAt ?? null,
  });
}


