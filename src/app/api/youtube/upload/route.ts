export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getToken } from "next-auth/jwt";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "stream";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.access_token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { key, title, description, privacyStatus } = await req.json();
    if (!key) return NextResponse.json({ error: "Missing S3 key" }, { status: 400 });

    // Ensure youtube.upload scope is granted
    const hasScope = Array.isArray(token.scopes)
      ? token.scopes.includes("https://www.googleapis.com/auth/youtube.upload")
      : false;
    if (!hasScope) {
      return NextResponse.json(
        { error: "Missing youtube.upload scope. Sign out and sign in again to grant permission." },
        { status: 403 }
      );
    }

    // S3 -> Node Readable stream
    const obj = await s3.send(
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key })
    );
    const body = obj.Body as Readable;

    // OAuth
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "postmessage"
    );
    oauth2Client.setCredentials({ access_token: token.access_token as string });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    const insertRes = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: { title, description },
        status: { privacyStatus: privacyStatus ?? "private" },
      },
      media: { body },
    });

    return NextResponse.json({ id: insertRes.data.id });
  } catch (error: unknown) {
    type GoogleErrorResponse = {
      response?: { status?: number; data?: { error?: { message?: string } } };
      message?: string;
    };
    const err = error as GoogleErrorResponse;
    const status = err.response?.status ?? 500;
    const message = err.response?.data?.error?.message || err.message || "Upload failed";
    return NextResponse.json({ error: message }, { status });
  }
}
