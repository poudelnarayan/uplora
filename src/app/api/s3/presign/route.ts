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
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const { filename, contentType, sizeBytes, teamId } = await req.json();
    if (!filename || !contentType) return NextResponse.json({ error: "Missing filename/contentType" }, { status: 400 });

    // Ensure user exists early
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: "", name: "" },
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

    // Generate a temporary upload ID (not a video ID)
    const uploadId = crypto.randomUUID();

    // Compute final S3 key using upload ID
    const finalKey = teamId
      ? `teams/${teamId}/videos/${uploadId}/original/${safeName}`
      : `users/${user.id}/videos/${uploadId}/original/${safeName}`;

    // Generate presigned PUT URL for final key
    const command = new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: finalKey, ContentType: contentType });
    const putUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });

    // Create upload lock with metadata for completion
    await prisma.uploadLock.create({ 
      data: { 
        userId: user.id, 
        key: finalKey,
        metadata: JSON.stringify({
          filename: safeName,
          contentType,
          sizeBytes: Number.isFinite(Number(sizeBytes)) ? Number(sizeBytes) : 0,
          teamId
        })
      } 
    });

    return NextResponse.json({ 
      putUrl, 
      key: finalKey, 
      tempId: uploadId,
      filename: safeName,
      contentType,
      sizeBytes: Number.isFinite(Number(sizeBytes)) ? Number(sizeBytes) : 0,
      teamId
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("presign error", e);
    return NextResponse.json({ error: "Failed to presign", detail: err?.message }, { status: 500 });
  }
}
