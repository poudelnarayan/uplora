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
        
        // Avoid hardcoded color styles in emails: keep HTML minimal and rely on text.
        html = `<pre>${escapeHtml(text)}</pre>`;
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
        
        // Avoid hardcoded color styles in emails: keep HTML minimal and rely on text.
        html = `<pre>${escapeHtml(text)}</pre>`;
      }

      let emailSent = false;
      let emailError: Error | null = null;

      // Send email
      try {
        await sendMail({
          to,
          subject,
          text,
          html,
          replyTo: includeEmail && userEmail ? userEmail : undefined,
        });
        emailSent = true;
      } catch (emailSendError) {
        console.error("Email sending failed:", emailSendError);
        emailError = emailSendError as Error;
      }

      // Store feedback in Supabase for analytics
      const { error: dbError } = await supabaseAdmin
        .from('feedbackSubmissions')
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
      }

      // Return success response with email status
      if (emailSent) {
        return createSuccessResponse({
          success: true,
          message: type === "idea" ? "Idea brainstormed successfully!" : "Feedback sent successfully!",
          emailSent: true
        });
      } else {
        return createSuccessResponse({
          success: true,
          message: type === "idea" 
            ? "Idea submitted successfully, but email delivery failed. We've logged your idea for review." 
            : "Feedback submitted successfully, but email delivery failed. We've logged your feedback for review.",
          emailSent: false,
          emailError: emailError?.message || "Email delivery failed"
        });
      }
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status || 400 });
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
