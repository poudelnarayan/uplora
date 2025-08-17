import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// POST /api/admin/bootstrap
// Headers: x-bootstrap-token: <ADMIN_BOOTSTRAP_TOKEN>
// Env required: ADMIN_BOOTSTRAP_TOKEN, ADMIN_EMAIL, ADMIN_PASSWORD
export async function POST(req: NextRequest) {
  try {
    const tokenHeader = req.headers.get("x-bootstrap-token");
    const BOOTSTRAP_TOKEN = process.env.ADMIN_BOOTSTRAP_TOKEN;
    const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "kan077bct049@kec.edu.np").toLowerCase();
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!BOOTSTRAP_TOKEN || !ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Server not configured for bootstrap" }, { status: 500 });
    }
    if (!tokenHeader || tokenHeader !== BOOTSTRAP_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    if (!existing) {
      const created = await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          name: "Admin User",
          emailVerified: new Date(),
          hashedPassword,
        },
      });
      return NextResponse.json({ ok: true, action: "created", userId: created.id, email: ADMIN_EMAIL });
    }

    await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: { hashedPassword, emailVerified: existing.emailVerified ?? new Date() },
    });
    return NextResponse.json({ ok: true, action: "updated", email: ADMIN_EMAIL });
  } catch (err) {
    console.error("/api/admin/bootstrap error", err);
    return NextResponse.json({ error: "Bootstrap failed" }, { status: 500 });
  }
}
