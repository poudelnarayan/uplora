export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { S3Client, CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename, contentType, teamId } = await req.json();
    if (!filename || !contentType) {
      return NextResponse.json({ error: "filename and contentType required" }, { status: 400 });
    }

    if (!process.env.S3_BUCKET || !process.env.AWS_REGION) {
      return NextResponse.json({ error: "S3 is not configured (S3_BUCKET/AWS_REGION)" }, { status: 500 });
    }

    const safeName = String(filename).replace(/[^\w.\- ]+/g, "_");

    // Ensure user exists
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {},
      create: { email: session.user.email, name: session.user.name ?? "", image: session.user.image ?? "" },
    });

    // Validate team access if teamId provided
    if (teamId) {
      const team = await prisma.team.findUnique({ where: { id: teamId } });
      if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
      if (team.ownerId !== user.id) {
        const membership = await prisma.teamMember.findFirst({ where: { teamId, userId: user.id } });
        if (!membership) return NextResponse.json({ error: "Not a member of this team" }, { status: 403 });
      }
    }

    // Create provisional video to get id
    const created = await prisma.video.create({
      data: {
        key: "provisioning",
        filename: safeName.replace(/\.[^/.]+$/, ''),
        contentType,
        sizeBytes: 0,
        userId: user.id,
        teamId: teamId || null,
      },
      select: { id: true, teamId: true, userId: true },
    });

    // Compute final key
    const finalKey = created.teamId
      ? `teams/${created.teamId}/videos/${created.id}/original/${safeName}`
      : `users/${created.userId}/videos/${created.id}/original/${safeName}`;

    // Start multipart upload (with robust error handling)
    let out;
    try {
      const cmd = new CreateMultipartUploadCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: finalKey,
        ContentType: contentType || "application/octet-stream",
      });
      out = await s3.send(cmd);
    } catch (err: any) {
      // Best-effort cleanup of provisional video row
      try { await prisma.video.delete({ where: { id: created.id } }); } catch {}
      const message = err?.name ? `${err.name}: ${err.message || 'S3 error'}` : 'S3 CreateMultipartUpload failed';
      return NextResponse.json({ error: message }, { status: 500 });
    }

    // Store upload lock and update video key
    try {
      // @ts-ignore
      await prisma.uploadLock?.create({ data: { userId: user.id, key: finalKey } });
      await prisma.video.update({ where: { id: created.id }, data: { key: finalKey } });
    } catch {}

    return NextResponse.json({ uploadId: out.UploadId, key: finalKey, partSize: 8 * 1024 * 1024, videoId: created.id });
  } catch (e: any) {
    const message = e?.message || 'Init failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


