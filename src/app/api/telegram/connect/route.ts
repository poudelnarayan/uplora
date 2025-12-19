export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";
import { updateUserSocialConnections } from "@/server/services/socialConnections";

/**
 * GET /api/telegram/connect
 *
 * Generates a one-time code and returns a Telegram deep-link.
 * User must click the link and press "Start" in Telegram to allow the bot to message them.
 */
export async function GET(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  if (!botUsername) {
    return NextResponse.json({ error: "Missing TELEGRAM_BOT_USERNAME" }, { status: 500 });
  }

  const code = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await updateUserSocialConnections(userId, current => ({
    ...current,
    telegram: {
      ...(current.telegram || {}),
      pendingCode: code,
      pendingExpiresAt: expiresAt,
    },
  }));

  const url = `https://t.me/${encodeURIComponent(botUsername)}?start=${encodeURIComponent(code)}`;
  return NextResponse.json({ ok: true, url, expiresAt });
}


