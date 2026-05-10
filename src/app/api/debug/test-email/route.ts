export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sendMail } from "@/lib/email";

// Diagnostic: GET /api/debug/test-email?to=you@example.com
// Shows config + actual SMTP error if send fails. Remove after debugging.
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const to = url.searchParams.get("to");

  const config = {
    SMTP_HOST: process.env.SMTP_HOST || "(not set)",
    SMTP_PORT: process.env.SMTP_PORT || "(not set, defaults 465)",
    SMTP_SECURE: process.env.SMTP_SECURE || "(not set, defaults true)",
    SMTP_USER: process.env.SMTP_USER || "(not set)",
    SMTP_PASS_set: !!process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM || "(not set)",
  };

  if (!to) {
    return NextResponse.json({
      config,
      hint: "Append ?to=your@email.com to actually send a test email.",
    });
  }

  try {
    const info = await sendMail({
      to,
      subject: "Uplora SMTP test",
      text: "If you received this, SMTP is working from your dev server.",
      html: "<p>If you received this, SMTP is working from your dev server.</p>",
    });
    return NextResponse.json({
      ok: true,
      config,
      info: {
        messageId: (info as { messageId?: string })?.messageId,
        accepted: (info as { accepted?: string[] })?.accepted,
        rejected: (info as { rejected?: string[] })?.rejected,
        response: (info as { response?: string })?.response,
      },
    });
  } catch (e) {
    const err = e as { message?: string; code?: string; command?: string; response?: string };
    return NextResponse.json(
      {
        ok: false,
        config,
        error: {
          message: err?.message || String(e),
          code: err?.code,
          command: err?.command,
          response: err?.response,
        },
      },
      { status: 500 },
    );
  }
}
