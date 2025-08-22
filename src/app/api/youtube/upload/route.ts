export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@clerk/nextjs/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "stream";
import { prisma } from "@/lib/prisma";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user's YouTube credentials from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { youtubeAccessToken: true, youtubeRefreshToken: true }
    });

    if (!user?.youtubeAccessToken) {
      return NextResponse.json(
        { error: "YouTube not connected. Please connect your YouTube account in settings." },
        { status: 403 }
      );
    }

    const { key, title, description, privacyStatus, madeForKids, thumbnailKey } = await req.json();
    if (!key) return NextResponse.json({ error: "Missing S3 key" }, { status: 400 });

    const obj = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }));
    const body = obj.Body as Readable;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({ 
      access_token: user.youtubeAccessToken,
      refresh_token: user.youtubeRefreshToken 
    });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    const insertRes = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: { title, description },
        status: {
          privacyStatus: privacyStatus ?? "private",
          madeForKids: Boolean(madeForKids),
        },
      },
      media: { body },
    });

    const videoId = insertRes.data.id;

    // If thumbnail provided, set it
    if (thumbnailKey && videoId) {
      try {
        const thumbObj = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: thumbnailKey }));
        const thumbBody = thumbObj.Body as Readable;
        await youtube.thumbnails.set({ videoId, media: { body: thumbBody } });
      } catch (e) {
        // Ignore thumbnail errors but continue
      }
    }

    // Update our Video record if exists
    try {
      await prisma.video.updateMany({ where: { key }, data: { status: "published" } });
    } catch {}

    return NextResponse.json({ id: videoId });
  } catch (error: unknown) {
    type GoogleErrorResponse = { response?: { status?: number; data?: { error?: { message?: string } } }; message?: string };
    const err = error as GoogleErrorResponse;
    const status = err.response?.status ?? 500;
    const message = err.response?.data?.error?.message || err.message || "Upload failed";
    return NextResponse.json({ error: message }, { status });
  }
}
