export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { publishInstagramImagePost } from "@/lib/instagram";

/**
 * Publish an Instagram image post using stored Instagram credentials.
 *
 * Body:
 * - imageUrl: string (required)
 * - caption?: string
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl : null;
    const caption = typeof body?.caption === "string" ? body.caption : undefined;

    if (!imageUrl) {
      return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
    }

    // Load stored Instagram credentials
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("socialConnections")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Failed to fetch user socialConnections:", error);
      return NextResponse.json({ error: "Failed to load credentials" }, { status: 500 });
    }

    const ig = user?.socialConnections?.instagram;
    const instagramUserId = ig?.businessAccountId || ig?.instagramUserId;
    const accessToken = ig?.accessToken;
    if (!instagramUserId || !accessToken) {
      return NextResponse.json(
        { error: "Instagram not connected. Please connect Instagram first." },
        { status: 400 }
      );
    }

    const result = await publishInstagramImagePost({
      instagramUserId: String(instagramUserId),
      accessToken: String(accessToken),
      imageUrl,
      caption,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (e: any) {
    console.error("Instagram publish-image error:", e);
    return NextResponse.json(
      { error: "Failed to publish Instagram image", detail: e?.message || String(e) },
      { status: 500 }
    );
  }
}


