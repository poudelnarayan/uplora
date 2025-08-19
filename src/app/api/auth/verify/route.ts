import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcast } from "@/lib/realtime";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.redirect(new URL("/verify-email?status=error", req.url));
    }

    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) {
      return NextResponse.redirect(new URL("/verify-email?status=error", req.url));
    }

    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      return NextResponse.redirect(new URL(`/verify-email?status=expired&email=${encodeURIComponent(user.email)}`, req.url));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    // Broadcast email verification event for real-time UI updates
    broadcast({
      type: "user.email.verified",
      userId: user.id,
      data: { email: user.email, emailVerified: new Date().toISOString() }
    });

    return NextResponse.redirect(new URL(`/verify-email?status=success&email=${encodeURIComponent(user.email)}`, req.url));
  } catch (e) {
    console.error("Email verification error:", e);
    return NextResponse.redirect(new URL("/verify-email?status=error", req.url));
  }
}
