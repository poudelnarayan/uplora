export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { findContentRowById, getTeamRoleForUser } from "../_shared";

export async function GET(_req: NextRequest, context: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  const { id } = context.params;
  const found = await findContentRowById(id);
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const teamId = found.row?.teamId;
  if (!teamId) return NextResponse.json({ error: "Not a team post" }, { status: 400 });

  const roleRes = await getTeamRoleForUser(String(teamId), userId);
  if (!roleRes.ok) return NextResponse.json({ error: roleRes.error }, { status: roleRes.status });

  return NextResponse.json({ role: roleRes.role });
}


