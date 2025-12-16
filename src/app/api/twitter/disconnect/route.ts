export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { decryptString } from "@/lib/tokenCrypto";
import { revokeXToken } from "@/lib/twitter";
import { getUserSocialConnections, updateUserSocialConnections } from "@/server/services/socialConnections";

/**
 * POST /api/twitter/disconnect
 *
 * Best-effort revoke token, then delete stored tokens.
 */
export async function POST(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const social = await getUserSocialConnections(userId);
    const tw = social.twitter;

    const clientId = process.env.X_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET;

    // Best-effort revoke (don't block disconnect on failure)
    if (tw?.encryptedAccessToken && clientId && clientSecret) {
      try {
        const accessToken = decryptString(tw.encryptedAccessToken);
        await revokeXToken({ token: accessToken, tokenTypeHint: "access_token", clientId, clientSecret });
      } catch (e) {
        console.warn("X revoke failed (continuing):", e);
      }
    }

    await updateUserSocialConnections(userId, current => ({ ...current, twitter: null }));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("X disconnect error:", e);
    return NextResponse.json({ error: "Failed to disconnect X" }, { status: 500 });
  }
}


