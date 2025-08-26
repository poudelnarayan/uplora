export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/clerk-supabase-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { sendMail } from "@/lib/email";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const result = await withAuth(async ({ clerkUser, supabaseUser }) => {
      const { message, category, includeEmail, path, teamId, teamName, type, title, priority } = await req.json();

      if (!message || typeof message !== "string" || message.trim().length < 3) {
        return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Feedback message required");
      }

      const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
      const userName = clerkUser.fullName || clerkUser.firstName || "Anonymous";
      const emailToUse = includeEmail ? (userEmail || "anonymous@local") : "anonymous@local";
      
      // Route emails based on submission type
      let to: string;
      let subject: string;
      
      if (type === "idea" || category === "Feature Request") {
        // Route ideas to brainstorm@uplora.io
        to = "brainstorm@uplora.io";
        subject = `💡 New Idea: ${title || "Feature Request"} from ${userName}`;
      } else {
        // Route feedback to feedback@uplora.io
        to = "feedback@uplora.io";
        subject = `📝 Feedback (${category || "General"}) from ${userName}`;
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
          `From: ${userName} <${emailToUse}>`,
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
                  <div><strong>From:</strong> ${userName}</div>
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
          `From: ${userName} <${emailToUse}>`,
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
            <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;padding:20px;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;font-size:24px;">📝 Feedback Submission</h1>
              <p style="margin:8px 0 0;opacity:0.9;">Support • Uplora</p>
            </div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
              <div style="background:#dbeafe;border:1px solid #3b82f6;border-radius:8px;padding:16px;margin-bottom:20px;">
                <h2 style="margin:0 0 12px;color:#1e40af;font-size:20px;">${category || "General"} Feedback</h2>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px;">
                  <div><strong>Category:</strong> ${category || "General"}</div>
                  <div><strong>Submitted:</strong> ${new Date().toLocaleString()}</div>
                  <div><strong>From:</strong> ${userName}</div>
                  <div><strong>Team:</strong> ${teamName || "Personal"}</div>
                </div>
              </div>
              <div style="background:#f8fafc;border-radius:8px;padding:20px;">
                <h3 style="margin:0 0 12px;color:#374151;">Feedback Message:</h3>
                <div style="white-space:pre-wrap;color:#4b5563;">${escapeHtml(message)}</div>
              </div>
              <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
                <p>This feedback was submitted via Uplora from: ${path || "unknown"}</p>
              </div>
            </div>
          </div>
        </body></html>`;
      }

      // Send email
      try {
        await sendMail({
          to,
          subject,
          text,
          html,
          replyTo: includeEmail && userEmail ? userEmail : undefined,
        });

        // Store feedback in Supabase for analytics
        const { error: dbError } = await supabaseAdmin
          .from('feedback_submissions')
          .insert({
            userId: supabaseUser.id,
            type: type || 'feedback',
            category: category || 'general',
            title: title || null,
            message: message,
            teamId: teamId || null,
            teamName: teamName || null,
            path: path || null,
            priority: priority || null,
            includeEmail: includeEmail || false
          });

        if (dbError) {
          console.error("Failed to store feedback in database:", dbError);
          // Don't fail the request if DB storage fails
        }

        return createSuccessResponse({
          success: true,
          message: type === "idea" ? "Idea submitted successfully!" : "Feedback submitted successfully!"
        });

      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to send feedback");
      }
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 401 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to submit feedback"),
      { status: 500 }
    );
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
