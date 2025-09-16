import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { to, subject, text, html } = await request.json();

    console.log("🧪 Testing email system...");
    console.log("📧 To:", to);
    console.log("📧 Subject:", subject);
    
    // Check all environment variables
    const envCheck = {
      SMTP_HOST: process.env.SMTP_HOST || 'Not set',
      SMTP_PORT: process.env.SMTP_PORT || 'Not set',
      SMTP_SECURE: process.env.SMTP_SECURE || 'Not set',
      SMTP_USER: process.env.SMTP_USER ? process.env.SMTP_USER.replace(/(.{2}).+(@.+)/, '$1***$2') : 'Not set',
      SMTP_PASS: process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'Not set',
      SMTP_FROM: process.env.SMTP_FROM || 'Not set',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'Not set'
    };
    
    console.log("📧 Environment Variables:", envCheck);

    // Check if we have email credentials
    const hasCredentials = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
    
    if (!hasCredentials) {
      console.log("❌ No SMTP credentials found");
      return NextResponse.json({
        success: false,
        error: "No SMTP credentials configured",
        environment: envCheck,
        required: ["SMTP_USER", "SMTP_PASS", "SMTP_HOST", "SMTP_PORT"]
      }, { status: 400 });
    }

    try {
      const info = await sendMail({
        to,
        subject: subject || "Test Email from Uplora",
        text: text || "This is a test email to verify the email system is working.",
        html: html || "<p>This is a test email to verify the email system is working.</p>",
      });

      console.log("✅ Test email sent successfully:", {
        to,
        messageId: info.messageId,
        accepted: (info as any)?.accepted,
        rejected: (info as any)?.rejected
      });

      return NextResponse.json({
        success: true,
        messageId: info.messageId,
        accepted: (info as any)?.accepted,
        rejected: (info as any)?.rejected
      });
    } catch (emailError) {
      console.error("❌ Test email failed:", emailError);
      
      return NextResponse.json({
        success: false,
        error: emailError instanceof Error ? emailError.message : "Email sending failed",
        details: emailError
      }, { status: 500 });
    }
  } catch (error) {
    console.error("❌ Test email API error:", error);
    return NextResponse.json(
      { error: "Failed to process test email request" },
      { status: 500 }
    );
  }
}
