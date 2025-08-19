import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import { passwordResetTemplate } from "@/lib/emailTemplates";
import { createErrorResponse, createSuccessResponse, requestPasswordResetSchema } from "@/lib/validation";

export const runtime = "nodejs";

function getBaseUrl(req: NextRequest) {
  const host = req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "http";
  // Prefer NEXT_PUBLIC_SITE_URL if set
  const publicUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (publicUrl) return publicUrl;
  return `${proto}://${host}`;
}

function isSmtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function POST(req: NextRequest) {
  try {
    console.log("[forgot-password] Processing request");
    
    const body = await req.json();
    const parsed = requestPasswordResetSchema.safeParse(body);
    if (!parsed.success) {
      console.log("[forgot-password] Validation failed:", parsed.error);
      return NextResponse.json(createErrorResponse("VALIDATION_ERROR", "Validation failed"), { status: 400 });
    }
    const { email } = parsed.data;

    console.log("[forgot-password] Looking up user:", email);
    const user = await prisma.user.findUnique({ where: { email } });
    
    // Respond success even if user not found, to avoid leaking existence
    if (!user || !user.hashedPassword) {
      console.log("[forgot-password] Non-existent or passwordless user requested reset:", email);
      return NextResponse.json(createSuccessResponse({ message: "If that email exists, a reset link has been sent." }));
    }

    console.log("[forgot-password] User found, creating reset token");
    
    // Create token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    console.log("[forgot-password] Reset token created successfully");

    const baseUrl = getBaseUrl(req);
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

    console.log("[forgot-password] Reset URL generated:", resetUrl);
    console.log("[forgot-password] SMTP configured:", isSmtpConfigured());

    if (!isSmtpConfigured()) {
      console.log("[forgot-password] SMTP not configured - email not sent");
      console.log("[forgot-password] To configure SMTP, set these environment variables:");
      console.log("  SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM");
      console.log("[forgot-password] Reset link for testing:", resetUrl);
      return NextResponse.json(createSuccessResponse({ message: "If that email exists, a reset link has been sent." }));
    }

    try {
      const emailPayload = passwordResetTemplate({ resetUrl, email });
      console.log("[forgot-password] Attempting to send email...");
      const info = await sendEmail({ 
        to: email, 
        subject: emailPayload.subject, 
        html: emailPayload.html, 
        text: emailPayload.text 
      });
      console.log("[forgot-password] Reset email sent successfully:", { 
        to: email, 
        messageId: (info as any)?.messageId,
        accepted: (info as any)?.accepted 
      });
    } catch (e) {
      console.warn("[forgot-password] Failed to send reset email:", e);
      // Do not expose email failure to avoid enumeration; still return success
    }

    return NextResponse.json(createSuccessResponse({ message: "If that email exists, a reset link has been sent." }));
  } catch (err) {
    console.error("[forgot-password] Unexpected error:", err);
    return NextResponse.json(createErrorResponse("INTERNAL_ERROR", "Something went wrong"), { status: 500 });
  }
}


