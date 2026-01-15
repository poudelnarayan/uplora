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
  try {
    const { id } = context.params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    // Get user details from Clerk and sync with Supabase
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    const userName = clerkUser.fullName || clerkUser.firstName || "";
    const userImage = clerkUser.imageUrl || "";

    // Ensure user exists in Supabase
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
      return NextResponse.json({ error: "Failed to sync user", details: userError.message }, { status: 500 });
    }

    // Get video
    const { data: video, error: videoError } = await supabaseAdmin
      .from('video_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Personal videos don't need approval workflow
    if (!video.teamId) {
      return NextResponse.json({ error: "Approval is only for team videos" }, { status: 400 });
    }

    // Get team
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, ownerId, name')
      .eq('id', video.teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Determine caller role
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
        return NextResponse.json({ error: "Not an active member of this team" }, { status: 403 });
      }
      callerRole = (role as any) || "MEMBER";
    }

    if (callerRole !== "OWNER" && callerRole !== "ADMIN") {
      return NextResponse.json({ error: "Only owner/admin can approve" }, { status: 403 });
    }

    // Check video status
    const currentStatus = String(video.status || "PROCESSING").toUpperCase();
    if (currentStatus !== "PENDING") {
      return NextResponse.json({ error: `Video is not pending approval (current: ${currentStatus})` }, { status: 400 });
    }

    // Approve the video
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
      return NextResponse.json({ error: "Failed to update video", details: updateError.message }, { status: 500 });
    }

    // Broadcast status change
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
    console.error("Approve-only failed:", e);
    return NextResponse.json({ 
      error: e?.message || "Failed to approve video",
      stack: process.env.NODE_ENV === "development" ? e?.stack : undefined
    }, { status: 500 });
  }
}
