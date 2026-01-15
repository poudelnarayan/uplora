export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";

export async function POST(
  _req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const { id } = context.params;

    // Sync user
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    const userName = clerkUser.fullName || clerkUser.firstName || "";
    const userImage = clerkUser.imageUrl || "";
    const { data: me, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        clerkId: userId,
        email: userEmail || "",
        name: userName,
        image: userImage,
        updatedAt: new Date().toISOString()
      }, { onConflict: 'clerkId' })
      .select()
      .single();

    if (userError) {
      return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
    }

    const { data: video, error: videoError } = await supabaseAdmin
      .from('video_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (!video.teamId) {
      return NextResponse.json({ error: "Approval is only for team videos" }, { status: 400 });
    }

    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', video.teamId)
      .single();
    if (teamError || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    let callerRole: "OWNER" | "ADMIN" | "MANAGER" | "EDITOR" | "MEMBER" | null = null;
    if (team.ownerId === me.id) {
      callerRole = "OWNER";
    } else {
      const { data: membership } = await supabaseAdmin
        .from("team_members")
        .select("role,status")
        .eq("teamId", team.id)
        .eq("userId", me.id)
        .single();
      const role = (membership as any)?.role as string | undefined;
      const mStatus = (membership as any)?.status as string | undefined;
      if (mStatus !== "ACTIVE") {
        return NextResponse.json({ error: "Not an active member of this team" }, { status: 403 });
      }
      callerRole = (role as any) || "MEMBER";
    }

    if (callerRole !== "OWNER" && callerRole !== "ADMIN") {
      return NextResponse.json({ error: "Only owner/admin can approve a pending video" }, { status: 403 });
    }

    if (String(video.status || "").toUpperCase() !== "PENDING") {
      return NextResponse.json({ error: "Video is not pending approval" }, { status: 400 });
    }

    const { data: approved, error: approveErr } = await supabaseAdmin
      .from('video_posts')
      .update({
        status: "APPROVED",
        approvedByUserId: me.id,
        requestedByUserId: null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', video.id)
      .select()
      .single();
    if (approveErr) {
      return NextResponse.json({ error: "Failed to approve video" }, { status: 500 });
    }

    broadcast({
      type: "video.status",
      teamId: video.teamId || null,
      payload: { id: video.id, status: "APPROVED", requestedByUserId: null, approvedByUserId: me.id }
    });
    broadcast({
      type: "post.status",
      teamId: String(video.teamId),
      payload: { id: video.id, status: "APPROVED", contentType: "video" }
    });

    return NextResponse.json({ ok: true, status: "APPROVED", video: approved });
  } catch (e) {
    console.error("Approve-only failed:", e);
    return NextResponse.json({ error: "Failed to approve video" }, { status: 500 });
  }
}

