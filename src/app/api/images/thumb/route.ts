export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });

  const head = await s3.send(new HeadObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
  }));

  const obj = await s3.send(new GetObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
  }));

  const body = obj.Body as any;

  return new NextResponse(body, {
    headers: {
      'Content-Type': (head.ContentType || obj.ContentType || 'image/jpeg') as string,
      // 1 year immutable; use ?v= to bust when the underlying file changes
      'Cache-Control': 'public, max-age=31536000, immutable',
      ...(head.ETag ? { ETag: head.ETag.replace(/"/g, '') } : {}),
    },
  });
}


