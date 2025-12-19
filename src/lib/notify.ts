/**
 * Optional outbound notifications.
 *
 * - Email is handled elsewhere (sendMail).
 * - These helpers are best-effort and should never break core workflows.
 */

export async function sendTelegramMessageToChat(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return { ok: false, skipped: true as const };

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Telegram send failed HTTP ${res.status}: ${err}`);
  }

  return { ok: true as const };
}

/**
 * Backwards-compatible helper for sending to a globally configured chat/group.
 * Prefer `sendTelegramMessageToChat()` for per-user routing.
 */
export async function sendTelegramMessage(text: string) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) return { ok: false, skipped: true as const };
  return sendTelegramMessageToChat(chatId, text);
}

