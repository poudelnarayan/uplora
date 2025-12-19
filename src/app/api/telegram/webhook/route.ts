export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { normalizeSocialConnections } from "@/types/socialConnections";

/**
 * POST /api/telegram/webhook
 *
 * Configure in Telegram:
 *   POST https://api.telegram.org/bot<token>/setWebhook?url=https://www.uplora.io/api/telegram/webhook
 *
 * Flow:
 * - User clicks /api/telegram/connect → gets deep-link https://t.me/<bot>?start=<code>
 * - User presses Start → Telegram sends /start <code> to this webhook
 * - We find the Uplora user who has socialConnections.telegram.pendingCode === <code>
 * - Store chatId + username and clear pendingCode
 */
export async function POST(req: NextRequest) {
  try {
    const update = await req.json().catch(() => null);
    const message = update?.message || update?.edited_message;
    const text: string = message?.text || "";
    const chatId = message?.chat?.id;
    const username = message?.from?.username || message?.chat?.username || null;

    if (!text || !chatId) return NextResponse.json({ ok: true });

    const match = text.match(/^\/start(?:\s+(.+))?$/);
    if (!match) return NextResponse.json({ ok: true });

    const code = (match[1] || "").trim();
    if (!code) return NextResponse.json({ ok: true });

    // Find user by pendingCode (stored in JSON)
    const { data: rows, error } = await supabaseAdmin
      .from("users")
      .select("id, clerkId, socialConnections")
      .not("socialConnections", "is", null);

    if (error) {
      console.error("Telegram webhook: users query failed", error);
      return NextResponse.json({ ok: true });
    }

    const now = Date.now();
    let target: { clerkId: string; socialConnections: any } | null = null;
    for (const r of rows || []) {
      const sc = normalizeSocialConnections((r as any).socialConnections);
      const pending = sc.telegram?.pendingCode;
      const exp = sc.telegram?.pendingExpiresAt ? Date.parse(sc.telegram.pendingExpiresAt) : 0;
      if (pending === code && (!exp || exp > now)) {
        target = { clerkId: String((r as any).clerkId), socialConnections: sc };
        break;
      }
    }

    if (!target) return NextResponse.json({ ok: true });

    const next = {
      ...target.socialConnections,
      telegram: {
        ...(target.socialConnections.telegram || {}),
        connectedAt: new Date().toISOString(),
        chatId: String(chatId),
        username: username ? String(username) : null,
        pendingCode: null,
        pendingExpiresAt: null,
      },
    };

    await supabaseAdmin
      .from("users")
      .update({ socialConnections: next, updatedAt: new Date().toISOString() })
      .eq("clerkId", target.clerkId);

    // Send a confirmation message back to the user
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (token) {
      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "✅ Telegram connected to Uplora. You’ll receive approval requests here.",
          }),
        });
      } catch {}
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Telegram webhook error:", e);
    return NextResponse.json({ ok: true });
  }
}


