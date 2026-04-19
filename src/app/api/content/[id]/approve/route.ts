export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";
import { getTeamRoleForUser } from "../_shared";

export async function POST(_req: NextRequest, context: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  const { id } = context.params;

  const { data: post, error: postError } = await supabaseAdmin
    .from("posts")
    .select("id, team_id, author_id, status, post_type, metadata")
    .eq("id", id)
    .maybeSingle();

  if (postError || !post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const teamId = post.team_id;
  if (!teamId) return NextResponse.json({ error: "Not a team post" }, { status: 400 });

  const roleRes = await getTeamRoleForUser(String(teamId), userId);
  if (!roleRes.ok) return NextResponse.json({ error: roleRes.error }, { status: roleRes.status });

  if (!["OWNER", "ADMIN", "MANAGER"].includes(roleRes.role)) {
    return NextResponse.json({ error: "Only owner/admin/manager can approve" }, { status: 403 });
  }

  const scheduledFor = post.metadata?.scheduled_for ? new Date(post.metadata.scheduled_for) : null;
  const nextStatus =
    scheduledFor && !isNaN(scheduledFor.getTime()) && scheduledFor.getTime() > Date.now()
      ? "scheduled"
      : "published";

  const { data: updated, error } = await supabaseAdmin
    .from("posts")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to approve" }, { status: 500 });

  broadcast({ type: "post.status", teamId: String(teamId), payload: { id, status: nextStatus.toUpperCase(), contentType: post.post_type } });
  return NextResponse.json({ ok: true, post: { ...updated, type: post.post_type }, status: nextStatus });
}
