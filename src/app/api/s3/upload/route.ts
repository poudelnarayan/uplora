export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const filename = url.searchParams.get("filename") ?? "upload.bin";
  const contentType = url.searchParams.get("contentType") ?? "application/octet-stream";

  const key = `uploads/${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${filename}`;

  const bodyBuffer = Buffer.from(await req.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      ContentType: contentType,
      Body: bodyBuffer,
    })
  );

  return NextResponse.json({ key, publicUrl: `${process.env.S3_PUBLIC_BASE}/${key}` });
}


