export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSocialConnections, updateUserSocialConnections } from "@/server/services/socialConnections";
import { refreshTikTokAccessToken, uploadTikTokVideo } from "@/lib/tiktok";

/**
 * POST /api/tiktok/upload
 *
 * Body:
 * - filePath: string (required) local server path (must exist on backend filesystem)
 * - caption: string (optional)
 *
 * Uploads a video in "inbox" mode (draft/sandbox). User completes in TikTok app.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const filePath = typeof body?.filePath === "string" ? body.filePath : null;
    const caption = typeof body?.caption === "string" ? body.caption : "";

    if (!filePath) return NextResponse.json({ error: "Missing filePath" }, { status: 400 });

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    if (!clientKey || !clientSecret) {
      return NextResponse.json({ error: "TikTok client not configured" }, { status: 500 });
    }

    const social = await getUserSocialConnections(userId);
    const tt = social.tiktok;
    if (!tt?.accessToken || !tt?.refreshToken) {
      return NextResponse.json({ error: "TikTok not connected" }, { status: 400 });
    }

    // Refresh token if expired (or missing expiry -> attempt upload; TikTok will error and user can reconnect)
    const isExpired =
      !!tt.tokenExpiresAt && Date.parse(tt.tokenExpiresAt) <= Date.now() + 60_000; // 1 min skew

    let accessToken = tt.accessToken;
    if (isExpired) {
      try {
        const refreshed = await refreshTikTokAccessToken({
          refreshToken: tt.refreshToken,
          clientKey,
          clientSecret,
        });
        accessToken = refreshed.accessToken;
        await updateUserSocialConnections(userId, current => ({
          ...current,
          tiktok: {
            ...(current.tiktok || {}),
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            tokenExpiresAt: refreshed.tokenExpiresAt,
            refreshTokenExpiresAt: refreshed.refreshTokenExpiresAt,
            scope: refreshed.scope ?? current.tiktok?.scope ?? null,
          },
        }));
      } catch (e) {
        console.error("TikTok refresh failure:", e);
        return NextResponse.json({ error: "Failed to refresh TikTok token" }, { status: 401 });
      }
    }

    try {
      const result = await uploadTikTokVideo(accessToken, filePath, caption);
      return NextResponse.json({ success: true, ...result });
    } catch (e: any) {
      console.error("TikTok upload failure:", e);
      return NextResponse.json(
        { error: "TikTok upload failed", detail: e?.message || String(e) },
        { status: 500 }
      );
    }
  } catch (e) {
    console.error("TikTok upload route error:", e);
    return NextResponse.json({ error: "Failed to upload to TikTok" }, { status: 500 });
  }
}


