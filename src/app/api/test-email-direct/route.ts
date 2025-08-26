export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_SECURE: process.env.SMTP_SECURE,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS ? "***SET***" : "NOT_SET",
      SMTP_FROM: process.env.SMTP_FROM,
      SMTP_DEBUG: process.env.SMTP_DEBUG,
    };

    console.log("Email Configuration Check:", envCheck);

    // Check if required variables are set
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({
        success: false,
        error: "Missing required SMTP configuration",
        envCheck
      }, { status: 500 });
    }

    const { testEmail } = await req.json();
    
    if (!testEmail) {
      return NextResponse.json({
        success: false,
        error: "testEmail parameter is required"
      }, { status: 400 });
    }

    // Test email to feedback@uplora.io
    console.log("Sending test email to feedback@uplora.io...");
    const feedbackResult = await sendMail({
      to: "feedback@uplora.io",
      subject: "🧪 Test Email - Feedback System",
      text: `This is a test email sent at ${new Date().toISOString()}
      
Test Details:
- Sent to: feedback@uplora.io
- From: ${process.env.SMTP_USER}
- SMTP Host: ${process.env.SMTP_HOST}
- SMTP Port: ${process.env.SMTP_PORT}
- SMTP Secure: ${process.env.SMTP_SECURE}

If you receive this email, the feedback system is working correctly.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">🧪 Test Email - Feedback System</h2>
          <p>This is a test email sent at <strong>${new Date().toISOString()}</strong></p>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Test Details:</h3>
            <ul>
              <li><strong>Sent to:</strong> feedback@uplora.io</li>
              <li><strong>From:</strong> ${process.env.SMTP_USER}</li>
              <li><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</li>
              <li><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</li>
              <li><strong>SMTP Secure:</strong> ${process.env.SMTP_SECURE}</li>
            </ul>
          </div>
          
          <p style="color: #059669; font-weight: bold;">
            ✅ If you receive this email, the feedback system is working correctly.
          </p>
        </div>
      `
    });

    // Test email to brainstorm@uplora.io
    console.log("Sending test email to brainstorm@uplora.io...");
    const brainstormResult = await sendMail({
      to: "brainstorm@uplora.io",
      subject: "💡 Test Email - Idea Lab System",
      text: `This is a test email sent at ${new Date().toISOString()}
      
Test Details:
- Sent to: brainstorm@uplora.io
- From: ${process.env.SMTP_USER}
- SMTP Host: ${process.env.SMTP_HOST}
- SMTP Port: ${process.env.SMTP_PORT}
- SMTP Secure: ${process.env.SMTP_SECURE}

If you receive this email, the idea lab system is working correctly.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">💡 Test Email - Idea Lab System</h2>
          <p>This is a test email sent at <strong>${new Date().toISOString()}</strong></p>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Test Details:</h3>
            <ul>
              <li><strong>Sent to:</strong> brainstorm@uplora.io</li>
              <li><strong>From:</strong> ${process.env.SMTP_USER}</li>
              <li><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</li>
              <li><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</li>
              <li><strong>SMTP Secure:</strong> ${process.env.SMTP_SECURE}</li>
            </ul>
          </div>
          
          <p style="color: #059669; font-weight: bold;">
            ✅ If you receive this email, the idea lab system is working correctly.
          </p>
        </div>
      `
    });

    // Test email to your provided email
    console.log(`Sending test email to ${testEmail}...`);
    const userResult = await sendMail({
      to: testEmail,
      subject: "🧪 Test Email - Uplora Email System",
      text: `This is a test email sent at ${new Date().toISOString()}
      
Test Details:
- Sent to: ${testEmail}
- From: ${process.env.SMTP_USER}
- SMTP Host: ${process.env.SMTP_HOST}
- SMTP Port: ${process.env.SMTP_PORT}
- SMTP Secure: ${process.env.SMTP_SECURE}

If you receive this email, your email configuration is working correctly.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">🧪 Test Email - Uplora Email System</h2>
          <p>This is a test email sent at <strong>${new Date().toISOString()}</strong></p>
          
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Test Details:</h3>
            <ul>
              <li><strong>Sent to:</strong> ${testEmail}</li>
              <li><strong>From:</strong> ${process.env.SMTP_USER}</li>
              <li><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</li>
              <li><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</li>
              <li><strong>SMTP Secure:</strong> ${process.env.SMTP_SECURE}</li>
            </ul>
          </div>
          
          <p style="color: #059669; font-weight: bold;">
            ✅ If you receive this email, your email configuration is working correctly.
          </p>
        </div>
      `
    });

    return NextResponse.json({
      success: true,
      message: "Test emails sent successfully!",
      results: {
        feedback: feedbackResult,
        brainstorm: brainstormResult,
        user: userResult
      },
      envCheck
    });

  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: error
    }, { status: 500 });
  }
}
