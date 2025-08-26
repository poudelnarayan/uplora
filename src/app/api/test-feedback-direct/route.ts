export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { message, category, type, title, priority, testEmail } = await req.json();

    if (!message || typeof message !== "string" || message.trim().length < 3) {
      return NextResponse.json({
        success: false,
        error: "Feedback message required"
      }, { status: 400 });
    }

    const userName = "Test User";
    const userEmail = testEmail || "test@example.com";
    
    // Route emails based on submission type
    let to: string;
    let subject: string;
    
    if (type === "idea" || category === "Feature Request") {
      to = "brainstorm@uplora.io";
      subject = `💡 Test Idea: ${title || "Feature Request"} from ${userName}`;
    } else {
      to = "feedback@uplora.io";
      subject = `📝 Test Feedback (${category || "General"}) from ${userName}`;
    }

    // Build email content
    let text: string;
    let html: string;
    
    if (type === "idea") {
      text = [
        `💡 TEST IDEA SUBMISSION`,
        `========================`,
        `Title: ${title || "Untitled"}`,
        `Priority: ${priority || "Medium"}`,
        `From: ${userName} <${userEmail}>`,
        `Team: Test Team`,
        `Page: /test`,
        `Submitted: ${new Date().toLocaleString()}`,
        "",
        `Description:`,
        message,
        "",
        `--- End of Test Idea ---`
      ].join("\n");
      
      html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.6;">
        <div style="max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:linear-gradient(135deg,#f59e0b,#f97316);color:white;padding:20px;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;font-size:24px;">💡 Test Idea Submission</h1>
            <p style="margin:8px 0 0;opacity:0.9;">Brainstorm • Uplora</p>
          </div>
          <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
            <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:16px;margin-bottom:20px;">
              <h2 style="margin:0 0 12px;color:#92400e;font-size:20px;">${escapeHtml(title || "Untitled Idea")}</h2>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px;">
                <div><strong>Priority:</strong> ${priority || "Medium"}</div>
                <div><strong>Submitted:</strong> ${new Date().toLocaleString()}</div>
                <div><strong>From:</strong> ${userName}</div>
                <div><strong>Team:</strong> Test Team</div>
              </div>
            </div>
            <div style="background:#f8fafc;border-radius:8px;padding:20px;">
              <h3 style="margin:0 0 12px;color:#374151;">Idea Description:</h3>
              <div style="white-space:pre-wrap;color:#4b5563;">${escapeHtml(message)}</div>
            </div>
            <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
              <p>This is a TEST idea submission via Uplora's Idea Lab from: /test</p>
            </div>
          </div>
        </div>
      </body></html>`;
    } else {
      text = [
        `📝 TEST FEEDBACK SUBMISSION`,
        `==========================`,
        `Category: ${category || "General"}`,
        `From: ${userName} <${userEmail}>`,
        `Team: Test Team`,
        `Page: /test`,
        `Submitted: ${new Date().toLocaleString()}`,
        "",
        `Message:`,
        message,
        "",
        `--- End of Test Feedback ---`
      ].join("\n");
      
      html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.6;">
        <div style="max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;padding:20px;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;font-size:24px;">📝 Test Feedback Submission</h1>
            <p style="margin:8px 0 0;opacity:0.9;">Support • Uplora</p>
          </div>
          <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
            <div style="background:#dbeafe;border:1px solid #3b82f6;border-radius:8px;padding:16px;margin-bottom:20px;">
              <h2 style="margin:0 0 12px;color:#1e40af;font-size:20px;">${category || "General"} Feedback</h2>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px;">
                <div><strong>Category:</strong> ${category || "General"}</div>
                <div><strong>Submitted:</strong> ${new Date().toLocaleString()}</div>
                <div><strong>From:</strong> ${userName}</div>
                <div><strong>Team:</strong> Test Team</div>
              </div>
            </div>
            <div style="background:#f8fafc;border-radius:8px;padding:20px;">
              <h3 style="margin:0 0 12px;color:#374151;">Feedback Message:</h3>
              <div style="white-space:pre-wrap;color:#4b5563;">${escapeHtml(message)}</div>
            </div>
            <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
              <p>This is a TEST feedback submission via Uplora from: /test</p>
            </div>
          </div>
        </div>
      </body></html>`;
    }

    let emailSent = false;
    let emailError = null;
    let emailResult = null;

    // Send email
    try {
      emailResult = await sendMail({
        to,
        subject,
        text,
        html,
        replyTo: userEmail,
      });
      
      console.log("Email sent successfully:", emailResult);
      emailSent = true;
    } catch (emailSendError) {
      console.error("Email sending failed:", emailSendError);
      emailError = emailSendError as Error;
    }

    // Store in database (optional for testing)
    let dbStored = false;
    try {
      const { error: dbError } = await supabaseAdmin
        .from('feedback_submissions')
        .insert({
          userId: 'test-user-id',
          type: type || 'feedback',
          category: category || 'general',
          title: title || null,
          message: message,
          teamId: null,
          teamName: 'Test Team',
          path: '/test',
          priority: priority || null,
          includeEmail: true
        });

      if (dbError) {
        console.error("Failed to store feedback in database:", dbError);
      } else {
        dbStored = true;
      }
    } catch (dbError) {
      console.error("Database error:", dbError);
    }

    // Return success response with email status
    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: type === "idea" ? "Test idea submitted successfully!" : "Test feedback submitted successfully!",
        emailSent: true,
        emailResult: emailResult,
        dbStored
      });
    } else {
      return NextResponse.json({
        success: true,
        message: type === "idea" 
          ? "Test idea submitted, but email delivery failed." 
          : "Test feedback submitted, but email delivery failed.",
        emailSent: false,
        emailError: emailError?.message || "Email delivery failed",
        dbStored
      });
    }

  } catch (error) {
    console.error("Test feedback submission error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit test feedback"
    }, { status: 500 });
  }
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
