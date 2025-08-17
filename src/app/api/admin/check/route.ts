import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// List of admin email addresses (credentials-only)
const ADMIN_EMAILS = [
  "kan077bct049@kec.edu.np",
];

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }

  const isAdmin = ADMIN_EMAILS.includes(session.user.email.toLowerCase());

  return NextResponse.json({ isAdmin });
}
