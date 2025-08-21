export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const { filename, contentType, sizeBytes, teamId, videoId } = await req.json();
    if (!filename || !contentType) return NextResponse.json({ error: "Missing filename/contentType" }, { status: 400 });
    if (!videoId) return NextResponse.json({ error: "Missing videoId" }, { status: 400 });

    // Validate it's a supported image format (YouTube requirements)
    const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'];
    if (!supportedTypes.includes(contentType)) {
      return NextResponse.json({ error: "Only JPG, PNG, GIF, or BMP files are allowed for thumbnails" }, { status: 400 });
    }

    // Build safe S3 key for thumbnails
    const safeName = String(filename).replace(/[^\w.\- ]+/g, "_");

    // Resolve video and enforce access based on team membership or personal ownership
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    // Ensure user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Enforce thumbnails only under team videos
    if (!video.teamId) {
      return NextResponse.json({ error: "Video must belong to a team for thumbnail upload" }, { status: 400 });
    }
    // Team access: owner or any member
    const team = await prisma.team.findUnique({ where: { id: video.teamId } });
    let allowed = team?.ownerId === user.id;
    if (!allowed) {
      const membership = await prisma.teamMember.findFirst({ where: { teamId: video.teamId, userId: user.id } });
      allowed = !!membership;
    }
    if (!allowed) return NextResponse.json({ error: "Not a member of this team" }, { status: 403 });

    // Only team-based path
    const key = `teams/${video.teamId}/videos/${videoId}/thumbnail/${safeName}`;

    // Generate presigned PUT URL
    const command = new PutObjectCommand({ 
      Bucket: process.env.S3_BUCKET!, 
      Key: key, 
      ContentType: contentType 
    });
    const putUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });

    // NOTE: We don't create a Video record for thumbnails - they're just files in S3
    // The thumbnailKey will be stored in the Video record when the video metadata is saved

    return NextResponse.json({ putUrl, key });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("thumbnail presign error", e);
    return NextResponse.json({ error: "Failed to presign thumbnail", detail: err?.message }, { status: 500 });
  }
}
