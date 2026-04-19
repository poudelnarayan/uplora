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
  try {
    const { id } = context.params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const client = await clerkClient();
    const me = await syncUser(userId, await client.users.getUser(userId));

    const video = await getVideoById(id);
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    if (video.status !== VideoStatus.READY_TO_PUBLISH) {
      return NextResponse.json({ error: "Only Ready-to-publish videos can be reverted to processing" }, { status: 400 });
    }

    if (!video.teamId) {
      return NextResponse.json({ error: "Not a team video" }, { status: 400 });
    }

    const { team, role } = await getTeamAndRole(video.teamId, me.id);
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    if (!role) return NextResponse.json({ error: "Not an active member of this team" }, { status: 403 });
    if (!["OWNER", "ADMIN", "MANAGER", "EDITOR"].includes(role)) {
      return NextResponse.json({ error: "Not allowed to revert ready" }, { status: 403 });
    }

    const updated = await updateVideoStatus(id, VideoStatus.PROCESSING);

    broadcast({
      type: "video.status",
      teamId: video.teamId,
      payload: { id, status: VideoStatus.PROCESSING, requestedByUserId: null, approvedByUserId: null }
    });
    broadcast({ type: "post.status", teamId: video.teamId, payload: { id, status: VideoStatus.PROCESSING, contentType: "video" } });

    return NextResponse.json({ ok: true, status: VideoStatus.PROCESSING, video: updated });
  } catch (e) {
    console.error("[mark-processing] error:", e);
    return NextResponse.json({ error: "Failed to revert status" }, { status: 500 });
  }
}
