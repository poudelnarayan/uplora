export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { to, subject, text, html } = await request.json();

    // Check if we have email credentials
    const hasCredentials = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
    
    console.log("📧 Send email request:", {
      to,
      subject,
      hasCredentials,
      smtpHost: process.env.SMTP_HOST,
      smtpPort: process.env.SMTP_PORT,
      smtpSecure: process.env.SMTP_SECURE,
      smtpUser: process.env.SMTP_USER ? process.env.SMTP_USER.replace(/(.{2}).+(@.+)/, '$1***$2') : 'Not set',
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

    // Development mode: Log email content for manual sharing
    console.log("\n" + "=".repeat(80));
    console.log("📧 DEVELOPMENT MODE - EMAIL WOULD BE SENT:");
    console.log("📧 TO:", to);
    console.log("📧 SUBJECT:", subject);
    console.log("📧 TEXT CONTENT:");
    console.log(text);
    if (html) {
      console.log("📧 HTML CONTENT:");
      console.log(html);
    }
    console.log("=".repeat(80));
    console.log("💡 To enable real email sending, configure SMTP environment variables");
    console.log("💡 See email setup guide for configuration options");
    console.log("=".repeat(80) + "\n");

    return NextResponse.json({
      success: true,
      messageId: "dev-" + Date.now(),
      method: "development",
      emailContent: {
        to,
        subject,
        text,
        html
      },
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
