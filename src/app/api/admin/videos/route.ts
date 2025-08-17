import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = ["kan77bct049@kec.edu.np"]; 

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ADMIN_EMAILS.includes(session.user.email.toLowerCase())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const videos = await prisma.video.findMany({
      select: { id: true, filename: true, status: true },
      orderBy: { uploadedAt: "desc" },
      take: 200
    });
    return NextResponse.json({ videos });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}


