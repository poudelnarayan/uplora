export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { S3Client, CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename, contentType, teamId } = await req.json();
  if (!filename || !contentType) {
    return NextResponse.json({ error: "filename and contentType required" }, { status: 400 });
  }

  const safeName = String(filename).replace(/[^\w.\- ]+/g, "_");

  // Ensure user exists
  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {},
    create: { email: session.user.email, name: session.user.name ?? "", image: session.user.image ?? "" },
  });

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

  // Start multipart upload
  const cmd = new CreateMultipartUploadCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: finalKey,
    ContentType: contentType || "application/octet-stream",
  });
  const out = await s3.send(cmd);

  // Store upload lock and update video key
  try {
    // @ts-ignore
    await prisma.uploadLock?.create({ data: { userId: user.id, key: finalKey } });
    await prisma.video.update({ where: { id: created.id }, data: { key: finalKey } });
  } catch {}

  return NextResponse.json({ uploadId: out.UploadId, key: finalKey, partSize: 8 * 1024 * 1024, videoId: created.id });
}


