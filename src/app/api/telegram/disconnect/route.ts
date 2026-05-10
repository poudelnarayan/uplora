export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateUserSocialConnections } from "@/server/services/socialConnections";
import { cascadeRemovePlatformFromTeams } from "@/server/services/teamPlatformGuard";

export async function POST(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await updateUserSocialConnections(userId, current => ({
    ...current,
    telegram: null,
  }));

  try {
    const removed = await cascadeRemovePlatformFromTeams(userId, "telegram");
    if (removed > 0) console.log(`[telegram/disconnect] revoked from ${removed} team(s)`);
  } catch (e) {
    console.error("[telegram/disconnect] cascade failed (non-fatal):", e);
  }

  return NextResponse.json({ ok: true });
}


