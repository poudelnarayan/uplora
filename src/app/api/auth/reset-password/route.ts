import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createErrorResponse, createSuccessResponse, resetPasswordSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(createErrorResponse("VALIDATION_ERROR", "Validation failed"), { status: 400 });
    }
    const { token, password } = parsed.data;

    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json(createErrorResponse("INVALID_CREDENTIALS", "Invalid or expired token"), { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { hashedPassword } }),
      prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } }),
    ]);

    return NextResponse.json(createSuccessResponse({ message: "Password updated" }));
  } catch (err) {
    return NextResponse.json(createErrorResponse("INTERNAL_ERROR", "Something went wrong"), { status: 500 });
  }
}


