import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const { to, subject, text, html } = await request.json();

    // Check if we have email credentials
    const hasCredentials = process.env.SMTP_USER && 
                          process.env.SMTP_PASS && 
                          process.env.SMTP_USER !== "YOUR_ACTUAL_EMAIL@gmail.com" &&
                          process.env.SMTP_PASS !== "YOUR_16_CHAR_APP_PASSWORD";

    if (hasCredentials) {
      try {
        // Create transporter
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: false, // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        // Send email
        const info = await transporter.sendMail({
          from: `"YTUploader" <${process.env.SMTP_USER}>`,
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
