import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  const { filename, contentType } = await req.json();
  const key = `uploads/${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });

  return NextResponse.json({
    url,
    key,
    publicUrl: `${process.env.S3_PUBLIC_BASE}/${key}`
  });
}
