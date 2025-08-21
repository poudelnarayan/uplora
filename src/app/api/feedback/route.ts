import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sendMail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    const { message, category, includeEmail, path, teamId, teamName, type, title, priority } = await req.json();

    if (!message || typeof message !== "string" || message.trim().length < 3) {
      return NextResponse.json({ error: "Feedback message required" }, { status: 400 });
    }

    const userEmail = includeEmail ? (session?.user?.email || "anonymous@local") : "anonymous@local";
    
    // Route emails based on submission type
    let to: string;
    let subject: string;
    
    if (type === "idea" || category === "Feature Request") {
      // Route ideas to brainstorm@uplora.io
      to = "brainstorm@uplora.io";
      subject = `💡 New Idea: ${title || "Feature Request"} from ${session?.user?.name || "Anonymous"}`;
    } else {
      // Route feedback to feedback@uplora.io
      to = "feedback@uplora.io";
      subject = `📝 Feedback (${category || "General"}) from ${session?.user?.name || "Anonymous"}`;
    }

    // Build email content based on type
    let text: string;
    let html: string;
    
    if (type === "idea") {
      // Idea Lab submission format
      text = [
        `💡 NEW IDEA SUBMISSION`,
        `========================`,
        `Title: ${title || "Untitled"}`,
        `Priority: ${priority || "Medium"}`,
        `From: ${session?.user?.name || "Anonymous"} <${userEmail}>`,
        `Team: ${teamName || "Personal"}`,
        `Page: ${path || "unknown"}`,
        `Submitted: ${new Date().toLocaleString()}`,
        "",
        `Description:`,
        message,
        "",
        `--- End of Idea ---`
      ].join("\n");
      
      html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.6;">
        <div style="max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:linear-gradient(135deg,#f59e0b,#f97316);color:white;padding:20px;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;font-size:24px;">💡 New Idea Submission</h1>
            <p style="margin:8px 0 0;opacity:0.9;">Brainstorm • Uplora</p>
          </div>
          <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
            <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:16px;margin-bottom:20px;">
              <h2 style="margin:0 0 12px;color:#92400e;font-size:20px;">${escapeHtml(title || "Untitled Idea")}</h2>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px;">
                <div><strong>Priority:</strong> ${priority || "Medium"}</div>
                <div><strong>Submitted:</strong> ${new Date().toLocaleString()}</div>
                <div><strong>From:</strong> ${session?.user?.name || "Anonymous"}</div>
                <div><strong>Team:</strong> ${teamName || "Personal"}</div>
              </div>
            </div>
            <div style="background:#f8fafc;border-radius:8px;padding:20px;">
              <h3 style="margin:0 0 12px;color:#374151;">Idea Description:</h3>
              <div style="white-space:pre-wrap;color:#4b5563;">${escapeHtml(message)}</div>
            </div>
            <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
              <p>This idea was submitted via Uplora's Idea Lab from: ${path || "unknown"}</p>
            </div>
          </div>
        </div>
      </body></html>`;
    } else {
      // Feedback submission format
      text = [
        `📝 FEEDBACK SUBMISSION`,
        `=====================`,
        `Category: ${category || "General"}`,
        `From: ${session?.user?.name || "Anonymous"} <${userEmail}>`,
        `Team: ${teamName || "Personal"}`,
        `Page: ${path || "unknown"}`,
        `Submitted: ${new Date().toLocaleString()}`,
        "",
        `Message:`,
        message,
        "",
        `--- End of Feedback ---`
      ].join("\n");
      
      html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.6;">
        <div style="max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:linear-gradient(135deg,#8b5cf6,#a855f7);color:white;padding:20px;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;font-size:24px;">📝 New Feedback</h1>
            <p style="margin:8px 0 0;opacity:0.9;">Feedback Studio • Uplora</p>
          </div>
          <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
            <div style="background:#f3e8ff;border:1px solid #c084fc;border-radius:8px;padding:16px;margin-bottom:20px;">
              <h2 style="margin:0 0 12px;color:#7c3aed;font-size:18px;">${category || "General"} Feedback</h2>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px;">
                <div><strong>From:</strong> ${session?.user?.name || "Anonymous"}</div>
                <div><strong>Email:</strong> ${userEmail}</div>
                <div><strong>Team:</strong> ${teamName || "Personal"}</div>
                <div><strong>Page:</strong> ${path || "unknown"}</div>
              </div>
            </div>
            <div style="background:#f8fafc;border-radius:8px;padding:20px;">
              <h3 style="margin:0 0 12px;color:#374151;">Feedback Message:</h3>
              <div style="white-space:pre-wrap;color:#4b5563;">${escapeHtml(message)}</div>
            </div>
            <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
              <p>Submitted: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </body></html>`;
    }

    // Send email with proper routing
    try {
      await sendMail({ to, subject, text, html });
      console.log(`✅ Email sent successfully to ${to}`);
      return NextResponse.json({ 
        ok: true, 
        emailSent: true,
        message: "Feedback submitted and email sent successfully" 
      });
    } catch (emailError) {
      console.error(`❌ Failed to send email to ${to}:`, emailError);
      return NextResponse.json({ 
        ok: true, 
        emailSent: false,
        message: "Feedback submitted but email delivery failed",
        error: "Email delivery failed - we've logged your feedback for manual review"
      });
    }
  } catch (e) {
    return NextResponse.json({ 
      error: "Failed to submit feedback",
      emailSent: false 
    }, { status: 500 });
  }
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
