import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        hashedPassword,
      },
    });

    // Create verification token
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
        text: `Welcome to Uplora!\n\nPlease verify your email by clicking the link below:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
        html: `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
          <h2>Verify your email</h2>
          <p>Thanks for creating an account on <strong>Uplora</strong>. Click the button below to verify your email address.</p>
          <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;">Verify Email</a></p>
          <p style="color:#64748b;font-size:13px;">If the button doesn't work, copy and paste this URL into your browser:</p>
          <p style="color:#64748b;font-size:13px;word-break:break-all;">${verifyUrl}</p>
        </body></html>`
      })
    }).catch(() => {});

    return NextResponse.json({
      message: "User created. Please check your email to verify your account.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
