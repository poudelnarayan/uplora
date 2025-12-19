export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";
import { findContentRowById, getTeamRoleForUser } from "../_shared";

export async function POST(_req: NextRequest, context: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  const { id } = context.params;
  const found = await findContentRowById(id);
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const teamId = found.row?.teamId;
  if (!teamId) return NextResponse.json({ error: "Not a team post" }, { status: 400 });

  const roleRes = await getTeamRoleForUser(String(teamId), userId);
  if (!roleRes.ok) return NextResponse.json({ error: roleRes.error }, { status: roleRes.status });

  if (!["OWNER", "ADMIN", "MANAGER"].includes(roleRes.role)) {
    return NextResponse.json({ error: "Only owner/admin/manager can approve" }, { status: 403 });
  }

  const scheduledFor = found.row?.scheduledFor ? new Date(found.row.scheduledFor) : null;
  const nextStatus =
    scheduledFor && !isNaN(scheduledFor.getTime()) && scheduledFor.getTime() > Date.now()
      ? "SCHEDULED"
      : "PUBLISHED";

  const { data: updated, error } = await supabaseAdmin
    .from(found.table)
    .update({ status: nextStatus, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to approve" }, { status: 500 });

  broadcast({ type: "post.status", teamId: String(teamId), payload: { id, status: nextStatus, contentType: found.type } });
  return NextResponse.json({ ok: true, post: { ...updated, type: found.type }, status: nextStatus });
}


