import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json([]);

    // Get teamId from query params
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');

    let whereClause: any = {};

    if (teamId) {
      // Check if user is the team owner
      const team = await prisma.team.findFirst({
        where: { id: teamId, ownerId: user.id }
      });
      
      let hasAccess = !!team;
      if (!hasAccess) {
        // If not owner, check if user is a team member
        const membership = await prisma.teamMember.findFirst({
          where: { teamId, userId: user.id }
        });
        hasAccess = !!membership;
      }
      
      if (!hasAccess) {
        return NextResponse.json({ error: "Not a member of this team" }, { status: 403 });
      }
      
      // Show all videos that belong to this team
      whereClause = { teamId };
    } else {
      // Show videos that belong to the user and have no team (legacy behavior)
      whereClause = { userId: user.id, teamId: null };
    }

    const videos = await prisma.video.findMany({
      where: whereClause,
      orderBy: { uploadedAt: "desc" },
      take: 50,
      select: {
        id: true,
        filename: true,
        status: true,
        uploadedAt: true,
        updatedAt: true,
        key: true,
        contentType: true,
        sizeBytes: true,
        thumbnailKey: true,
        description: true,
        visibility: true,
        madeForKids: true,
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

    return NextResponse.json(videos.map(v => ({
      id: v.id,
      title: (v.filename || "").replace(/\.[^/.]+$/, ''), // Remove file extension
      thumbnail: "",
      status: v.status || "PROCESSING",
      uploadedAt: v.uploadedAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
      approvalRequestedAt: v.status === "PENDING" ? v.updatedAt.toISOString() : undefined,
      publishedAt: v.status === "PUBLISHED" ? v.updatedAt.toISOString() : undefined,
      duration: undefined,
      views: undefined,
      likes: undefined,
      s3Key: v.key,
      thumbnailKey: v.thumbnailKey,
      contentType: v.contentType,
      sizeBytes: v.sizeBytes,
      description: v.description,
      visibility: v.visibility,
      madeForKids: v.madeForKids,
      uploader: {
        id: v.user.id,
        name: v.user.name,
        email: v.user.email,
        image: v.user.image
      }
    })));
  } catch (e) {
    return NextResponse.json({ error: "Failed to list videos" }, { status: 500 });
  }
}
