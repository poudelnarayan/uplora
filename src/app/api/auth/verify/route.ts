import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) return NextResponse.redirect(new URL("/signin?verified=0", req.url));

    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) return NextResponse.redirect(new URL("/signin?verified=0", req.url));

    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      return NextResponse.redirect(new URL("/signin?verified=expired", req.url));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    return NextResponse.redirect(new URL("/signin?verified=1", req.url));
  } catch (e) {
    return NextResponse.redirect(new URL("/signin?verified=0", req.url));
  }
}
