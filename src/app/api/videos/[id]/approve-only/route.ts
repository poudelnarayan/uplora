export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { broadcast } from "@/lib/realtime";
import { VideoStatus } from "@/types/videoStatus";
import { getVideoById, syncUser, getTeamAndRole, updateVideoStatus } from "@/lib/video-utils";

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  let step = "init";
  try {
    step = "auth";
    const { id } = context.params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required", step }, { status: 401 });

    step = "sync-user";
    const client = await clerkClient();
    const me = await syncUser(userId, await client.users.getUser(userId));

    step = "get-video";
    const video = await getVideoById(id);
    if (!video) return NextResponse.json({ error: "Video not found", step }, { status: 404 });

    if (!video.teamId) {
      return NextResponse.json({ error: "Approval is only for team videos", step }, { status: 400 });
    }

    step = "check-role";
    const { team, role } = await getTeamAndRole(video.teamId, me.id);
    if (!team) return NextResponse.json({ error: "Team not found", step }, { status: 404 });
    if (!role) return NextResponse.json({ error: "Not an active member of this team", step }, { status: 403 });
    if (role !== "OWNER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Only owner/admin can approve", callerRole: role, step }, { status: 403 });
    }

    step = "check-status";
    if (video.status !== VideoStatus.APPROVAL_REQUESTED) {
      return NextResponse.json({ error: `Video is not pending approval (current: ${video.status})`, step }, { status: 400 });
    }

    step = "update-video";
    const updated = await updateVideoStatus(id, VideoStatus.APPROVAL_APPROVED, {
      approved_by_user_id: me.id,
      requested_by_user_id: null,
    });

    step = "broadcast";
    broadcast({
      type: "video.status",
      teamId: video.teamId,
      payload: { id, status: VideoStatus.APPROVAL_APPROVED, requestedByUserId: null, approvedByUserId: me.id }
    });
    broadcast({
      type: "post.status",
      teamId: video.teamId,
      payload: { id, status: VideoStatus.APPROVAL_APPROVED, contentType: "video" }
    });

    return NextResponse.json({ ok: true, status: VideoStatus.APPROVAL_APPROVED, video: updated });
  } catch (e: any) {
    console.error("Approve-only failed at step:", step, e);
    return NextResponse.json({
      error: e?.message || "Failed to approve video",
      step,
    }, { status: 500 });
  }
}
