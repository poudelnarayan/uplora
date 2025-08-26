export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { type = "feedback" } = await req.json();
    
    const to = type === "idea" ? "brainstorm@uplora.io" : "feedback@uplora.io";
    const subject = type === "idea" 
      ? "🧪 Test: Idea Email" 
      : "🧪 Test: Feedback Email";
    
    const text = `This is a test email for ${type} submission.`;
    const html = `<p>This is a test email for <strong>${type}</strong> submission.</p>`;
    
    console.log(`📧 Sending test email to: ${to}`);
    
    await sendMail({
      to,
      subject,
      text,
      html,
    });
    
    console.log("✅ Test email sent successfully");
    
    return NextResponse.json({
      success: true,
      message: `Test ${type} email sent to ${to}`,
      emailSent: true
    });
    
  } catch (error) {
    console.error("❌ Test email failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to send test email"
    }, { status: 500 });
  }
}
