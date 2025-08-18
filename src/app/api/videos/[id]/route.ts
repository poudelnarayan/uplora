import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { broadcast } from "@/lib/realtime";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Auth required" }, { status: 401 });
    const params = await context.params;

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const v = await prisma.video.findUnique({ 
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });
    if (!v) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    // Check access: owner or team member/owner if team video
    let hasAccess = v.userId === user.id; // Video uploader access
    if (!hasAccess && v.teamId) {
      // If team video, allow team owner or any member
      const team = await prisma.team.findUnique({ where: { id: v.teamId } });
      if (team?.ownerId === user.id) {
        hasAccess = true;
      } else {
        const membership = await prisma.teamMember.findFirst({
          where: { teamId: v.teamId, userId: user.id }
        });
        hasAccess = !!membership;
      }
    }
    
    if (!hasAccess) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    return NextResponse.json({
      id: v.id,
      key: v.key,
      filename: v.filename,
      contentType: v.contentType,
      status: v.status || "PROCESSING",
      uploadedAt: v.uploadedAt.toISOString(),
      updatedAt: v.updatedAt?.toISOString?.() || undefined,
      teamId: v.teamId || undefined,
      // Include metadata fields
      description: v.description || "",
      visibility: v.visibility || "public",
      madeForKids: v.madeForKids || false,
      thumbnailKey: v.thumbnailKey || null,
      uploader: {
        id: v.user.id,
        name: v.user.name,
        email: v.user.email,
        image: v.user.image
      }
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to get video" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Auth required" }, { status: 401 });
    const params = await context.params;
    const body = await req.json();

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check access: owner or team member (team owner included)
    const video = await prisma.video.findUnique({ where: { id: params.id } });
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    let hasAccess = video.userId === user.id; // Uploader (personal owner)
    let team: { ownerId: string } | null = null;
    if (!hasAccess && video.teamId) {
      // Team owner has access
      team = await prisma.team.findUnique({ where: { id: video.teamId }, select: { ownerId: true } });
      if (team?.ownerId === user.id) {
        hasAccess = true;
      } else {
        // Check if user is a member of the video's team
        const membership = await prisma.teamMember.findFirst({
          where: { teamId: video.teamId, userId: user.id }
        });
        hasAccess = !!membership;
      }
    }
    
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // If video is awaiting publish, only owner can edit (uploader for personal, team owner for team videos)
    if (video.status === 'PENDING') {
      let isOwner = video.userId === user.id;
      if (video.teamId && !isOwner) {
        // use previously fetched team when available
        const t = team || (await prisma.team.findUnique({ where: { id: video.teamId }, select: { ownerId: true } }));
        if (t?.ownerId === user.id) isOwner = true;
      }
      if (!isOwner) {
        return NextResponse.json({ error: "Awaiting publish. Only the owner can edit." }, { status: 403 });
      }
    }

    const { title, description, visibility, madeForKids, thumbnailKey, status } = body as {
      title?: string;
      description?: string;
      visibility?: string;
      madeForKids?: boolean;
      thumbnailKey?: string | null;
      status?: string;
    };

    // Optional: owner-only status revert from PENDING -> PROCESSING
    let statusData: { status?: any; requestedByUserId?: string | null; approvedByUserId?: string | null } = {};
    if (typeof status === 'string') {
      // Determine if current user is the owner of this video/team
      let isOwnerOfVideo = video.userId === user.id;
      if (!isOwnerOfVideo && video.teamId) {
        const team = await prisma.team.findUnique({ where: { id: video.teamId } });
        if (team?.ownerId === user.id) isOwnerOfVideo = true;
      }
      // Allow only reverting to PROCESSING by owner
      if (isOwnerOfVideo && status.toUpperCase() === 'PROCESSING') {
        statusData = { status: 'PROCESSING', requestedByUserId: null, approvedByUserId: null };
      }
    }

    const updated = await prisma.video.update({
      where: { id: params.id },
      data: {
        filename: typeof title === 'string' && title.length ? title : undefined,
        description: typeof description === 'string' ? description : undefined,
        visibility: typeof visibility === 'string' ? visibility : undefined,
        madeForKids: typeof madeForKids === 'boolean' ? madeForKids : undefined,
        thumbnailKey: typeof thumbnailKey === 'string' ? thumbnailKey : thumbnailKey === null ? null : undefined,
        ...statusData,
      },
    });

    // Broadcast updates with status information
    if (statusData.status) {
      // Status change event
      broadcast({ 
        type: "video.status", 
        teamId: updated.teamId || null, 
        payload: { id: updated.id, status: statusData.status }
      });
    } else {
      // General update event
      broadcast({ 
        type: "video.updated", 
        teamId: updated.teamId || null, 
        payload: { id: updated.id }
      });
    }

    return NextResponse.json({ ok: true, video: updated });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update video" }, { status: 500 });
  }
}
