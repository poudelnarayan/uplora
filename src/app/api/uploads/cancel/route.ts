export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { S3Client, AbortMultipartUploadCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const { key, uploadId, videoId } = await req.json();

    // Abort multipart upload if in progress
    if (key && uploadId) {
      try {
        await s3.send(new AbortMultipartUploadCommand({ Bucket: process.env.S3_BUCKET!, Key: key, UploadId: uploadId }));
      } catch {}
    }

    // Best-effort delete S3 object if it exists and was partially uploaded (direct PUT scenario cannot be aborted, but object may exist)
    if (key && !uploadId) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }));
      } catch {}
    }

    // Remove provisional video row if present and still not associated with a full file
    if (videoId) {
      try {
        await prisma.video.delete({ where: { id: videoId } });
      } catch {}
    }

    // Release any upload lock for this user
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) await prisma.uploadLock.deleteMany({ where: { userId: user.id } });
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to cancel upload" }, { status: 500 });
  }
}


