export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  let step = "init";
  try {
    step = "get-params";
    const { id } = context.params;
    
    step = "auth";
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required", step }, { status: 401 });

    step = "clerk-user";
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    const userName = clerkUser.fullName || clerkUser.firstName || "";
    const userImage = clerkUser.imageUrl || "";

    step = "upsert-user";
    const { data: me, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        clerkId: userId,
        email: userEmail || "", 
        name: userName, 
        image: userImage,
        updatedAt: new Date().toISOString()
      }, {
        onConflict: 'clerkId'
      })
      .select()
      .single();

    if (userError) {
      console.error("Approve-only user sync error:", userError);
      return NextResponse.json({ error: "Failed to sync user", details: userError.message, step }, { status: 500 });
    }

    step = "get-video";
    const { data: video, error: videoError } = await supabaseAdmin
      .from('video_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: "Video not found", step }, { status: 404 });
    }

    if (!video.teamId) {
      return NextResponse.json({ error: "Approval is only for team videos", step }, { status: 400 });
    }

    step = "get-team";
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, ownerId, name')
      .eq('id', video.teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: "Team not found", step }, { status: 404 });
    }

    step = "check-role";
    let callerRole: "OWNER" | "ADMIN" | "MANAGER" | "EDITOR" | "MEMBER" | null = null;
    if (team.ownerId === me.id) {
      callerRole = "OWNER";
    } else {
      const { data: membership } = await supabaseAdmin
        .from('team_members')
        .select('role,status')
        .eq('teamId', team.id)
        .eq('userId', me.id)
        .single();

      const role = (membership as any)?.role as string | undefined;
      const mStatus = (membership as any)?.status as string | undefined;
      if (!membership || mStatus !== "ACTIVE") {
        return NextResponse.json({ error: "Not an active member of this team", step }, { status: 403 });
      }
      callerRole = (role as any) || "MEMBER";
    }

    if (callerRole !== "OWNER" && callerRole !== "ADMIN") {
      return NextResponse.json({ error: "Only owner/admin can approve", callerRole, step }, { status: 403 });
    }

    step = "check-status";
    const currentStatus = String(video.status || "PROCESSING").toUpperCase();
    if (currentStatus !== "PENDING") {
      return NextResponse.json({ error: `Video is not pending approval (current: ${currentStatus})`, step }, { status: 400 });
    }

    step = "update-video";
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('video_posts')
      .update({ 
        status: "APPROVED",
        approvedByUserId: me.id,
        requestedByUserId: null,
        updatedAt: new Date().toISOString()
      })
      .eq('id', video.id)
      .select()
      .single();

    if (updateError) {
      console.error("Approve-only update error:", updateError);
      return NextResponse.json({ error: "Failed to update video", details: updateError.message, step }, { status: 500 });
    }

    step = "broadcast";
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

    return NextResponse.json({ ok: true, status: "APPROVED", video: updated });
  } catch (e: any) {
    console.error("Approve-only failed at step:", step, e);
    return NextResponse.json({ 
      error: e?.message || "Failed to approve video",
      step,
      stack: process.env.NODE_ENV === "development" ? e?.stack : undefined
    }, { status: 500 });
  }
}
