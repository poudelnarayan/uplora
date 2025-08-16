import { NextResponse } from "next/server";
import { sendMail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { to = process.env.SMTP_USER } = await req.json();

    const info = await sendMail({
      to,
      subject: "Uplora test email ✅",
      text: "This is a plain-text test from Uplora via Fastmail SMTP.",
      html: `<div style="font-family:system-ui">
               <h2>Uplora test email ✅</h2>
               <p>This came from <b>notification@uplora.io</b> using Fastmail SMTP.</p>
             </div>`,
    });

    return NextResponse.json({ ok: true, messageId: (info as any)?.messageId });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "send failed" }, { status: 500 });
  }
}


