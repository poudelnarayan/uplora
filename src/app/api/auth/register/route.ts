import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { registerSchema, createErrorResponse, createSuccessResponse, ErrorCodes, handleZodError } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input using Zod
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      const errorResponse = handleZodError(validationResult.error);
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { email, password, name } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        createErrorResponse(
          ErrorCodes.DUPLICATE_EMAIL,
          "An account with this email already exists",
          { email: "This email is already registered" }
        ),
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Prepare verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    // Create everything atomically
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          name,
          hashedPassword,
        },
      });

      const personalTeam = await tx.team.create({
        data: {
          name: `${createdUser.name || "Personal"}'s Workspace`,
          description: "Your personal video workspace",
          ownerId: createdUser.id,
          isPersonal: true,
        },
      });

      await tx.user.update({
        where: { id: createdUser.id },
        data: {
          personalTeamId: personalTeam.id,
          verificationToken: token,
          verificationTokenExpires: expires,
        },
      });

      return createdUser;
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

    return NextResponse.json(
      createSuccessResponse({
        message: "User created successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        redirectUrl: `/verify-email?email=${encodeURIComponent(email)}`
      })
    );
  } catch (error) {
    console.error("Registration error:", error);
    
    // Handle Prisma errors
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          createErrorResponse(
            ErrorCodes.DUPLICATE_EMAIL,
            "An account with this email already exists",
            { email: "This email is already registered" }
          ),
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        "Failed to create account. Please try again."
      ),
      { status: 500 }
    );
  }
}
