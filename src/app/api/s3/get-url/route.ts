export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const key = url.searchParams.get('key');
  const expiresIn = url.searchParams.get('expiresIn');
  const contentType = url.searchParams.get('contentType');

  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  const isThumb = /\/(thumb|thumbnail)\//.test(key);
  const isPreview = /\/preview\//.test(key);
  const command = new GetObjectCommand({ 
    Bucket: process.env.S3_BUCKET!, 
    Key: key,
    // Enhanced cache headers - longer cache for thumbnails
    ResponseCacheControl: isThumb ? "max-age=86400" : isPreview ? "max-age=3600" : "max-age=3600",
    ResponseContentDisposition: "inline",
    ResponseContentType: typeof contentType === 'string' && contentType.length > 0 ? contentType : undefined,
  });
  
  // Longer expiry for thumbnails (24h vs 1h for videos)
  const maxExpiry = isThumb ? 86400 : 3600;
  const signedUrl = await getSignedUrl(s3, command, { 
    expiresIn: Math.min(Number(expiresIn || 300), maxExpiry) 
  });
  return NextResponse.json({ url: signedUrl });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, expiresIn, contentType } = await req.json();
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  const command = new GetObjectCommand({ 
    Bucket: process.env.S3_BUCKET!, 
    Key: key,
    // These headers help with streaming
    ResponseCacheControl: "max-age=3600",
    ResponseContentDisposition: "inline",
    ResponseContentType: typeof contentType === 'string' && contentType.length > 0 ? contentType : undefined,
  });
  
  const url = await getSignedUrl(s3, command, { 
    expiresIn: Math.min(Number(expiresIn || 300), 3600) 
  });
  return NextResponse.json({ url });
}


