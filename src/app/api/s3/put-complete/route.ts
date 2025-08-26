export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Auth required" }, { status: 401 });
    }

    const { key, filename, contentType, sizeBytes, teamId } = await req.json();
    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    // Ensure user exists
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { 
        id: userId, 
        email: "", 
        name: "" 
      },
    });

    // Derive teamId from key if not provided
    const m = key.match(/(?:teams\/(.*?)|users\/(.*?))\/videos\/(.*?)\//);
    const teamIdFromKey = m && m[1] ? m[1] : null;
    const finalTeamId = teamId ?? teamIdFromKey;

    // Validate team access if teamId is provided
    if (finalTeamId) {
      // Check if user is the team owner
      const team = await prisma.team.findFirst({
        where: { id: finalTeamId, ownerId: user.id }
      });
      
      if (!team) {
        // If not owner, check if user is a team member
        const membership = await prisma.teamMember.findFirst({
          where: { teamId: finalTeamId, userId: user.id }
        });
        if (!membership) {
          return NextResponse.json({ error: "Not a member of this team" }, { status: 403 });
        }
      }
    }

    // Create the video record only after successful upload completion
    const title = String(filename || "").replace(/\.[^/.]+$/, "") || "Untitled";
    const video = await prisma.video.create({
      data: {
        key,
        filename: title,
        contentType: contentType || "application/octet-stream",
        sizeBytes: typeof sizeBytes === "number" ? sizeBytes : 0,
        teamId: finalTeamId,
        userId: user.id,
        status: "PROCESSING",
      },
    });

    // Broadcast video creation event
    broadcast({ 
      type: "video.created", 
      teamId: video.teamId || null, 
      payload: { id: video.id, title: video.filename }
    });

    // Release upload lock for this user
    await prisma.uploadLock.deleteMany({
      where: { userId: user.id, key }
    });

    return NextResponse.json({ success: true, videoId: video.id });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("put complete error", e);
    return NextResponse.json({ 
      error: "Failed to complete upload", 
      detail: err?.message 
    }, { status: 500 });
  }
}
