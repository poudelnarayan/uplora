export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    const { filename, contentType, sizeBytes, teamId, videoId } = await req.json();
    if (!filename || !contentType) return NextResponse.json({ error: "Missing filename/contentType" }, { status: 400 });

    // Validate it's a supported image format (YouTube requirements)
    const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'];
    if (!supportedTypes.includes(contentType)) {
      return NextResponse.json({ error: "Only JPG, PNG, GIF, or BMP files are allowed for thumbnails" }, { status: 400 });
    }

    // Build safe S3 key for thumbnails
    const safeName = String(filename).replace(/[^\w.\- ]+/g, "_");

    // Build structured key; if videoId missing, place under tmp with user id
    const base = teamId ? `teams/${teamId}` : `users/${session.user.email?.replace(/[^\w.-]+/g, "_")}`;
    const key = videoId
      ? `${base}/videos/${videoId}/thumb/${safeName}`
      : `${base}/thumb/tmp-${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${safeName}`;

    // Generate presigned PUT URL
    const command = new PutObjectCommand({ 
      Bucket: process.env.S3_BUCKET!, 
      Key: key, 
      ContentType: contentType 
    });
    const putUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });

    // NOTE: We don't create a Video record for thumbnails - they're just files in S3
    // The thumbnailKey will be stored in the Video record when the video metadata is saved

    return NextResponse.json({ putUrl, key });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("thumbnail presign error", e);
    return NextResponse.json({ error: "Failed to presign thumbnail", detail: err?.message }, { status: 500 });
  }
}
