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

    // Sync user
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    const userName = clerkUser.fullName || clerkUser.firstName || "";
    const userImage = clerkUser.imageUrl || "";

    const { data: me, error: userError } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          id: userId,
          clerkId: userId,
          email: userEmail || "",
          name: userName,
          image: userImage,
          updatedAt: new Date().toISOString(),
        },
        { onConflict: "clerkId" }
      )
      .select()
      .single();

    if (userError || !me) {
      return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
    }

    const { data: video, error: videoError } = await supabaseAdmin
      .from("video_posts")
      .select("*")
      .eq("id", id)
      .single();
    if (videoError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const currentStatus = String(video.status || "PROCESSING").toUpperCase();
    if (currentStatus === "PUBLISHED") {
      return NextResponse.json({ error: "Already published" }, { status: 400 });
    }
    if (currentStatus === "PENDING") {
      return NextResponse.json({ error: "Already pending approval" }, { status: 400 });
    }
    if (currentStatus === "APPROVED") {
      return NextResponse.json({ error: "Already approved" }, { status: 400 });
    }
    if (currentStatus === "READY") {
      return NextResponse.json({ ok: true, status: "READY" });
    }

    // Personal video: uploader can mark ready
    if (!video.teamId) {
      if (video.userId !== me.id) {
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
      }
    } else {
      // Team video: editor/manager (and owner/admin) can mark ready
      const { data: team, error: teamError } = await supabaseAdmin
        .from("teams")
        .select("id, ownerId")
        .eq("id", video.teamId)
        .single();
      if (teamError || !team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }
      if (team.ownerId === me.id) {
        // Owner can mark ready too (useful for solo workflows)
      } else {
        const { data: membership } = await supabaseAdmin
          .from("team_members")
          .select("role,status")
          .eq("teamId", team.id)
          .eq("userId", me.id)
          .single();
        const role = String((membership as any)?.role || "");
        const mStatus = String((membership as any)?.status || "");
        if (mStatus !== "ACTIVE") {
          return NextResponse.json({ error: "Not an active member of this team" }, { status: 403 });
        }
        if (role !== "MANAGER" && role !== "EDITOR" && role !== "ADMIN") {
          return NextResponse.json({ error: "Not allowed to mark ready" }, { status: 403 });
        }
      }

    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("video_posts")
      .update({
        // NOTE: Supabase enum "VideoStatus" in prod does not include READY.
        // We use existing enum value PENDING to represent "Ready to publish" (user-facing),
        // and keep the approval workflow via requestedByUserId/approvedByUserId + APPROVED.
        status: "PENDING",
        requestedByUserId: null,
        approvedByUserId: null,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[mark-ready] Supabase update error:", updateError);
      return NextResponse.json(
        {
          error: updateError.message || "Failed to mark ready",
          code: (updateError as any).code,
          details: (updateError as any).details,
          hint: (updateError as any).hint,
        },
        { status: 500 }
      );
    }

    broadcast({
      type: "video.status",
      teamId: updated.teamId || null,
      payload: { id: updated.id, status: "PENDING", requestedByUserId: null, approvedByUserId: null }
    });
    if (updated.teamId) {
      broadcast({
        type: "post.status",
        teamId: String(updated.teamId),
        payload: { id: updated.id, status: "PENDING", contentType: "video" }
      });
    }
    return NextResponse.json({ ok: true, status: "PENDING", video: updated });
  } catch (e) {
    console.error("[mark-ready] Unexpected error:", e);
    return NextResponse.json({ error: "Failed to mark ready" }, { status: 500 });
  }
}


