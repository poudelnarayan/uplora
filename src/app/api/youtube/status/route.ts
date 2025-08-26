export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user details from Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    const userName = clerkUser.fullName || clerkUser.firstName || "";
    const userImage = clerkUser.imageUrl || "";

    // Ensure user exists in Supabase
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        clerkId: userId,
        email: userEmail || "", 
        name: userName, 
        image: userImage,
        updatedAt: new Date().toISOString()
      }, {
        onConflict: 'clerkId'
      })
      .select('youtubeAccessToken, youtubeChannelId, youtubeChannelTitle, youtubeExpiresAt')
      .single();

    if (userError) {
      console.error("User sync error:", userError);
      return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
    }

    const isConnected = !!(user?.youtubeAccessToken && user?.youtubeChannelId);
    
    // Check if token is expired
    const isExpired = user?.youtubeExpiresAt && new Date() > new Date(user.youtubeExpiresAt);

    return NextResponse.json({
      isConnected: isConnected && !isExpired,
      channelTitle: user?.youtubeChannelTitle,
      channelId: user?.youtubeChannelId,
      isExpired,
    });
  } catch (error) {
    console.error("YouTube status error:", error);
    return NextResponse.json(
      { error: "Failed to get YouTube status" },
      { status: 500 }
    );
  }
}
