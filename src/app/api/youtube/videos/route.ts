export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.access_token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Need read scope
    const scopes = Array.isArray(token.scopes) ? token.scopes : [];
    const hasRead = scopes.includes("https://www.googleapis.com/auth/youtube.readonly") || scopes.includes("https://www.googleapis.com/auth/youtube");
    if (!hasRead) {
      return NextResponse.json({ error: "Missing youtube.readonly scope" }, { status: 403 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "postmessage"
    );
    oauth2Client.setCredentials({ access_token: token.access_token as string });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    // Get uploads playlist ID
    const ch = await youtube.channels.list({ part: ["contentDetails"], mine: true });
    const uploadsPlaylist = ch.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylist) return NextResponse.json([]);

    // Get playlist items (recent uploads)
    const pl = await youtube.playlistItems.list({ part: ["snippet", "contentDetails"], playlistId: uploadsPlaylist, maxResults: 50 });
    const items = pl.data.items ?? [];

    const videos = items.map((it) => ({
      id: it.contentDetails?.videoId || it.id!,
      title: it.snippet?.title || "Untitled",
      thumbnail: it.snippet?.thumbnails?.medium?.url || it.snippet?.thumbnails?.default?.url || "",
      status: "published" as const,
      uploadedAt: it.contentDetails?.videoPublishedAt || it.snippet?.publishedAt || new Date().toISOString(),
      duration: undefined,
      views: undefined,
      likes: undefined,
      youtubeId: it.contentDetails?.videoId || undefined,
    }));

    return NextResponse.json(videos);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}
