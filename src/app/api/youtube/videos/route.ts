export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@clerk/nextjs/server";
import { getUserSocialConnections } from "@/server/services/socialConnections";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user's YouTube credentials from unified social connections
    const social = await getUserSocialConnections(userId);
    const yt = social.youtube;
    if (!yt?.accessToken || !yt?.refreshToken) {
      return NextResponse.json(
        { error: "YouTube not connected. Please connect your YouTube account in settings." },
        { status: 403 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.YT_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.uplora.io'}/api/youtube/connect`
    );
    oauth2Client.setCredentials({ 
      access_token: yt.accessToken,
      refresh_token: yt.refreshToken 
    });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    // Get uploads playlist ID
    const ch = await youtube.channels.list({ part: ["contentDetails"], mine: true });
    const uploadsPlaylist = ch.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylist) return NextResponse.json([]);

    // Get playlist items (recent uploads)
    const pl = await youtube.playlistItems.list({ part: ["snippet", "contentDetails"], playlistId: uploadsPlaylist, maxResults: 50 });
    const items = pl.data.items ?? [];

    const videos = items.map((it) => ({
      id: it.contentDetails?.videoId,
      title: it.snippet?.title,
      description: it.snippet?.description,
      thumbnail: it.snippet?.thumbnails?.medium?.url,
      publishedAt: it.snippet?.publishedAt,
      channelTitle: it.snippet?.channelTitle,
    }));

    return NextResponse.json(videos);
  } catch (error) {
    console.error("YouTube videos error:", error);
    return NextResponse.json({ error: "Failed to fetch YouTube videos" }, { status: 500 });
  }
}
