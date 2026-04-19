export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/telegram/webhook
 *
 * Flow:
 * - User clicks /api/telegram/connect → gets deep-link https://t.me/<bot>?start=<code>
 * - User presses Start → Telegram sends /start <code> to this webhook
 * - We find the social_accounts row where platform='telegram' and access_token = code
 * - Store chatId + username and clear the pending code
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

    const now = new Date().toISOString();

    // Find the social_accounts row with this pending code (stored in access_token)
    const { data: rows, error } = await supabaseAdmin
      .from("social_accounts")
      .select("id, token_expires_at, team_id")
      .eq("platform", "telegram")
      .eq("access_token", code)
      .is("revoked_at", null);

    if (error) {
      console.error("Telegram webhook: social_accounts query failed", error);
      return NextResponse.json({ ok: true });
    }

    const target = (rows || []).find(row => {
      if (!row.token_expires_at) return true;
      return Date.parse(row.token_expires_at) > Date.now();
    });

    if (!target) return NextResponse.json({ ok: true });

    // Update with chatId and clear pending code
    await supabaseAdmin
      .from("social_accounts")
      .update({
        external_account_id: String(chatId),
        display_name: username ? String(username) : null,
        access_token: '',
        token_expires_at: null,
        updated_at: now,
      })
      .eq("id", target.id);

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (token) {
      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "✅ Telegram connected to Uplora. You'll receive approval requests here.",
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
