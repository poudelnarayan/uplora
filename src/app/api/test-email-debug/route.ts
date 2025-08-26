import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log("🔍 EMAIL DEBUG - Environment variables:");
    console.log("SMTP_HOST:", process.env.SMTP_HOST ? "✅ Set" : "❌ Missing");
    console.log("SMTP_PORT:", process.env.SMTP_PORT || "Default: 465");
    console.log("SMTP_USER:", process.env.SMTP_USER ? "✅ Set" : "❌ Missing");
    console.log("SMTP_PASS:", process.env.SMTP_PASS ? "✅ Set" : "❌ Missing");
    console.log("SMTP_FROM:", process.env.SMTP_FROM || "Default: Uplora <SMTP_USER>");
    console.log("SMTP_SECURE:", process.env.SMTP_SECURE || "Default: true");
    console.log("SMTP_DEBUG:", process.env.SMTP_DEBUG || "Default: false");

    const testSubject = "🧪 Uplora Email Test";
    const testText = `
    This is a test email from Uplora to verify email delivery.
    
    If you received this email, your email configuration is working correctly!
    
    Sent at: ${new Date().toISOString()}
    `;
    
    const testHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #00ADB5;">🧪 Uplora Email Test</h2>
      <p>This is a test email from Uplora to verify email delivery.</p>
      <p>If you received this email, your email configuration is working correctly!</p>
      <hr style="border: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        Sent at: ${new Date().toISOString()}<br>
        From: Uplora Email System
      </p>
    </div>
    `;

    console.log("📧 Attempting to send test email to:", email);
    
    const result = await sendMail({
      to: email,
      subject: testSubject,
      text: testText,
      html: testHtml,
    });

    console.log("✅ Email sent successfully:", result);

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
      envelope: result.envelope,
    });

  } catch (error) {
    console.error("❌ Email sending failed:", error);
    
    // Enhanced error details
    const errorDetails = {
      message: error instanceof Error ? error.message : "Unknown error",
      code: (error as any)?.code,
      command: (error as any)?.command,
      response: (error as any)?.response,
      responseCode: (error as any)?.responseCode,
    };

    console.error("📊 Error details:", errorDetails);

    return NextResponse.json({
      success: false,
      error: "Failed to send test email",
      details: errorDetails,
    }, { status: 500 });
  }
}

export async function GET() {
  const envStatus = {
    SMTP_HOST: !!process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT || "465 (default)",
    SMTP_USER: !!process.env.SMTP_USER,
    SMTP_PASS: !!process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM || `Uplora <${process.env.SMTP_USER}>`,
    SMTP_SECURE: process.env.SMTP_SECURE || "true (default)",
    SMTP_DEBUG: process.env.SMTP_DEBUG || "false (default)",
  };

  return NextResponse.json({
    message: "Email configuration status",
    environment: envStatus,
    ready: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
  });
}
