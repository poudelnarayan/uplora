import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { to, subject, text, html } = await request.json();

    // Check if we have email credentials
    const hasCredentials = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

    if (hasCredentials) {
      try {
        const info = await sendMail({
          to,
          subject,
          text,
          html,
        });

        return NextResponse.json({
          success: true,
          messageId: info.messageId,
          method: "email"
        });
      } catch (emailError) {
        console.error("Email sending failed, falling back to manual mode:", emailError);
      }
    }

    // Fallback: Log email content for manual sharing
    console.log("\n" + "=".repeat(80));
    console.log("📧 EMAIL WOULD BE SENT TO:", to);
    console.log("📧 SUBJECT:", subject);
    console.log("📧 CONTENT:");
    console.log(text);
    console.log("=".repeat(80) + "\n");

    return NextResponse.json({
      success: true,
      messageId: "manual-" + Date.now(),
      method: "manual",
      emailContent: {
        to,
        subject,
        text,
        html
      }
    });
  } catch (error) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { error: "Failed to process email" },
      { status: 500 }
    );
  }
}
