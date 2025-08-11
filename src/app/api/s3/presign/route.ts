export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const { filename, contentType, sizeBytes, teamId } = await req.json();
    if (!filename || !contentType) return NextResponse.json({ error: "Missing filename/contentType" }, { status: 400 });

    // Ensure user exists early
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {},
      create: { email: session.user.email, name: session.user.name || "", image: session.user.image || "" },
    });

    // Enforce single active upload per user
    const existingLock = await prisma.uploadLock.findUnique({ where: { userId: user.id } }).catch(() => null);
    if (existingLock) {
      return NextResponse.json({ error: "Another upload is in progress" }, { status: 409 });
    }

    // Build safe file name
    const safeName = String(filename).replace(/[^\w.\- ]+/g, "_");

    // Validate team access if teamId is provided
    let teamForAccess: any = null;
    if (teamId) {
      teamForAccess = await prisma.team.findFirst({ where: { id: teamId } });
      if (!teamForAccess) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }
      if (teamForAccess.ownerId !== user.id) {
        const membership = await prisma.teamMember.findFirst({ where: { teamId, userId: user.id } });
        if (!membership) return NextResponse.json({ error: "Not a member of this team" }, { status: 403 });
      }
    }

    // Create a provisional video row to obtain the id
    const created = await prisma.video.create({
      data: {
        key: "provisioning",
        filename: safeName.replace(/\.[^/.]+$/, ''),
        contentType,
        sizeBytes: Number.isFinite(Number(sizeBytes)) ? Number(sizeBytes) : 0,
        userId: user.id,
        teamId: teamId || null,
      },
      select: { id: true, teamId: true, userId: true },
    });

    // Compute final S3 key using requested structure
    const finalKey = created.teamId
      ? `teams/${created.teamId}/videos/${created.id}/original/${safeName}`
      : `users/${created.userId}/videos/${created.id}/original/${safeName}`;

    // Update the video row with the final key
    await prisma.video.update({ where: { id: created.id }, data: { key: finalKey } });

    // Generate presigned PUT URL for final key
    const command = new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: finalKey, ContentType: contentType });
    const putUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });

    // Create upload lock
    await prisma.uploadLock.create({ data: { userId: user.id, key: finalKey } });

    return NextResponse.json({ putUrl, key: finalKey, videoId: created.id });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("presign error", e);
    return NextResponse.json({ error: "Failed to presign", detail: err?.message }, { status: 500 });
  }
}
