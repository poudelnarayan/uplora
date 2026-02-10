export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/email";
import { safeAuth, safeCurrentUser } from "@/lib/clerk-supabase-utils";
import { timingSafeEqual } from "crypto";

const INTERNAL_SECRET_HEADER = "x-uplora-internal-secret";
const DEFAULT_DEV_ALLOW = process.env.NODE_ENV !== "production";

function hasValidInternalSecret(request: NextRequest) {
  const expected = process.env.SEND_EMAIL_API_SECRET;
  if (!expected) return false;
  const provided = request.headers.get(INTERNAL_SECRET_HEADER);
  if (!provided) return false;
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}

function redactAddress(value: string) {
  return value.replace(/(^[^@]{2})[^@]*(@.*$)/, "$1***$2");
}

export async function POST(request: NextRequest) {
  try {
    const internalAllowed = hasValidInternalSecret(request) || (!process.env.SEND_EMAIL_API_SECRET && DEFAULT_DEV_ALLOW);
    if (!internalAllowed) {
      const { userId } = await safeAuth();
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const user = await safeCurrentUser();
      const role = (user?.publicMetadata as any)?.role as string | undefined;
      if (!role || !["admin", "editor"].includes(role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { to, subject, text, html } = await request.json();
    if (!to || !subject || (!text && !html)) {
      return NextResponse.json({ error: "to, subject, and text or html are required" }, { status: 400 });
    }

    // Check if we have email credentials
    const hasCredentials = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

    const toList = Array.isArray(to) ? to : [to];
    const redactedTo = toList.map((addr) => (typeof addr === "string" ? redactAddress(addr) : "unknown"));

    console.log("📧 Send email request:", {
      toCount: toList.length,
      to: redactedTo,
      hasCredentials,
      smtpHost: process.env.SMTP_HOST,
      smtpPort: process.env.SMTP_PORT,
      smtpSecure: process.env.SMTP_SECURE,
      smtpUser: process.env.SMTP_USER ? process.env.SMTP_USER.replace(/(.{2}).+(@.+)/, "$1***$2") : "Not set",
      smtpFrom: process.env.SMTP_FROM
    });

    if (hasCredentials) {
      try {
        const info = await sendMail({
          to,
          subject,
          text,
          html,
        });

        console.log("✅ Email sent successfully:", {
          to,
          subject,
          messageId: info.messageId,
          accepted: (info as any)?.accepted,
          rejected: (info as any)?.rejected
        });

        return NextResponse.json({
          success: true,
          messageId: info.messageId,
          method: "email",
          accepted: (info as any)?.accepted,
          rejected: (info as any)?.rejected
        });
      } catch (emailError) {
        console.error("❌ Email sending failed:", emailError);
        
        return NextResponse.json({
          success: false,
          error: emailError instanceof Error ? emailError.message : "Email sending failed",
          method: "email_failed"
        }, { status: 500 });
      }
    }

    // Development mode: avoid logging full email content to reduce PII exposure
    console.log("📧 DEVELOPMENT MODE - EMAIL WOULD BE SENT (content redacted)");
    console.log("💡 To enable real email sending, configure SMTP environment variables");

    return NextResponse.json({
      success: true,
      messageId: "dev-" + Date.now(),
      method: "development",
      note: "Email logged to console. Configure SMTP for real sending."
    });
  } catch (error) {
    console.error("❌ Email API error:", error);
    return NextResponse.json(
      { error: "Failed to process email" },
      { status: 500 }
    );
  }
}
