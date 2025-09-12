import { NextRequest, NextResponse } from "next/server";
import { welcomeEmailTemplate } from "@/lib/emailTemplates";

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const userName = name || "Test User";
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`;

    const emailTemplate = welcomeEmailTemplate({
      userName,
      userEmail: email,
      dashboardUrl
    });

    // Send email via our email API
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: email,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
      }),
    });

    if (emailResponse.ok) {
      const result = await emailResponse.json();
      return NextResponse.json({
        success: true,
        message: "Welcome email sent successfully",
        emailResult: result
      });
    } else {
      const error = await emailResponse.text();
      return NextResponse.json({
        success: false,
        error: "Failed to send email",
        details: error
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Test welcome email error:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
