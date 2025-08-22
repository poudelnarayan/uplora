export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { S3Client, UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, uploadId, partNumber } = await req.json();
  if (!key || !uploadId || !partNumber) {
    return NextResponse.json({ error: "key, uploadId, partNumber required" }, { status: 400 });
  }

  const url = await getSignedUrl(
    s3,
    new UploadPartCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      UploadId: uploadId,
      PartNumber: Number(partNumber),
    }),
    { expiresIn: 60 * 10 }
  );

  return NextResponse.json({ url });
}


