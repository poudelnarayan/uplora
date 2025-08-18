import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { message: "Email is already verified" },
        { status: 400 }
      );
    }

    // Create new verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: token,
        verificationTokenExpires: expires,
      }
    });

    // Always use absolute origin for email links
    const reqOrigin = request.nextUrl.origin;
    const base = process.env.NEXTAUTH_URL || reqOrigin;
    const verifyUrl = `${base.replace(/\/$/, "")}/api/auth/verify?token=${token}`;

    // Send verification email via existing send-email endpoint
    await fetch(`${base.replace(/\/$/, "")}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: "Verify your Uplora account",
        text: `Hello ${user.name || 'there'}!\n\nPlease verify your email by clicking the link below:\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't request this email, you can safely ignore it.`,
        html: `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
          <h2>Verify your email</h2>
          <p>Hello ${user.name || 'there'}!</p>
          <p>Please verify your email address by clicking the button below:</p>
          <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;">Verify Email</a></p>
          <p style="color:#64748b;font-size:13px;">If the button doesn't work, copy and paste this URL into your browser:</p>
          <p style="color:#64748b;font-size:13px;word-break:break-all;">${verifyUrl}</p>
          <p style="color:#64748b;font-size:13px;">This link expires in 24 hours.</p>
          <p style="color:#64748b;font-size:13px;">If you didn't request this email, you can safely ignore it.</p>
        </body></html>`
      })
    }).catch((error) => {
      console.error("Failed to send verification email:", error);
    });

    return NextResponse.json({
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
