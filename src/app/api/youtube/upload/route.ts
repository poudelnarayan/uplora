export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@clerk/nextjs/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "stream";
import { supabaseAdmin } from "@/lib/supabase";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user's YouTube credentials from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('youtubeAccessToken, youtubeRefreshToken')
      .eq('clerkId', userId)
      .single();

    if (userError || !user?.youtubeAccessToken) {
      return NextResponse.json(
        { error: "YouTube not connected. Please connect your YouTube account in settings." },
        { status: 403 }
      );
    }

    const { key, title, description, privacyStatus, madeForKids, thumbnailKey } = await req.json();
    if (!key) return NextResponse.json({ error: "Missing S3 key" }, { status: 400 });

    const obj = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }));
    const body = obj.Body as Readable;

    const origin = process.env.NEXT_PUBLIC_SITE_URL || undefined;
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.YT_REDIRECT_URI || `${origin || ''}/api/youtube/connect`
    );
    oauth2Client.setCredentials({ 
      access_token: user.youtubeAccessToken,
      refresh_token: user.youtubeRefreshToken 
    });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    // Use resumable upload to avoid multipart size limits
    const insertRes = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: title || "Untitled",
          description: description || "",
        },
        status: {
          privacyStatus: privacyStatus || "private",
          madeForKids: madeForKids || false,
        },
      },
      media: {
        body: body,
      },
    }, {
      // Explicitly tell googleapis to use resumable protocol
      params: { uploadType: 'resumable' }
    } as any);

    const videoId = insertRes.data.id;

    // Optional: set thumbnail if provided
    if (videoId && thumbnailKey) {
      try {
        const thumb = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: thumbnailKey }));
        const thumbBody = thumb.Body as Readable;
        const mime = (thumb as any).ContentType || 'image/jpeg';
        await youtube.thumbnails.set({
          videoId,
          media: { mimeType: mime as string, body: thumbBody },
        } as any);
      } catch (e) {
        console.error('Thumbnail set failed:', e);
        // Continue without failing the whole upload
      }
    }

    return NextResponse.json({
      success: true,
      videoId: videoId,
      title: insertRes.data.snippet?.title,
    });
  } catch (error) {
    console.error("YouTube upload error:", error);
    return NextResponse.json({ error: "Failed to upload to YouTube" }, { status: 500 });
  }
}
