export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { getVideoById, syncUser, getTeamAndRole } from "@/lib/video-utils";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const { id } = context.params;

    const client = await clerkClient();
    const user = await syncUser(userId, await client.users.getUser(userId));

    const video = await getVideoById(id);
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    if (!video.teamId) {
      const role = video.userId === user.id ? "PERSONAL_OWNER" : null;
      if (!role) return NextResponse.json({ error: "No access" }, { status: 403 });
      return NextResponse.json({ role });
    }

    const { team, role } = await getTeamAndRole(video.teamId, user.id);
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    if (!role) return NextResponse.json({ error: "Not a member of this team" }, { status: 403 });

    return NextResponse.json({ role });
  } catch (e) {
    console.error("Role API error:", e);
    return NextResponse.json({ error: "Failed to get role" }, { status: 500 });
  }
}
