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
    .select("id, team_id, author_id, status, post_type")
    .eq("id", id)
    .maybeSingle();

  if (postError || !post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const teamId = post.team_id;
  if (!teamId) return NextResponse.json({ error: "Not a team post" }, { status: 400 });

  const roleRes = await getTeamRoleForUser(String(teamId), userId);
  if (!roleRes.ok) return NextResponse.json({ error: roleRes.error }, { status: roleRes.status });

  // Only editors need to request approval; owner/admin/manager can publish without permission.
  if (roleRes.role !== "EDITOR") {
    return NextResponse.json({ error: "Approval request is only required for editors" }, { status: 400 });
  }

  const { data: updated, error } = await supabaseAdmin
    .from("posts")
    .update({ status: "pending_approval", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to request approval" }, { status: 500 });

  broadcast({ type: "post.status", teamId: String(teamId), payload: { id, status: "PENDING", contentType: post.post_type } });
  return NextResponse.json({ ok: true, post: { ...updated, type: post.post_type } });
}
