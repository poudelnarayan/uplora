export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's Facebook connection status from socialConnections JSON field
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('socialConnections')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Failed to fetch Facebook status:", error);
      return NextResponse.json({ error: "Failed to fetch connection status" }, { status: 500 });
    }

    const facebookConnection = user?.socialConnections?.facebook;
    const isConnected = !!(facebookConnection?.accessToken && facebookConnection?.userId);

    if (!isConnected) {
      return NextResponse.json({
        connected: false,
        user: null,
        pages: [],
        instagramAccounts: []
      });
    }

    // If connected, verify the token is still valid and get fresh data
    try {
      const userInfoResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${facebookConnection.accessToken}`);
      const userInfo = await userInfoResponse.json();

      if (!userInfoResponse.ok || userInfo.error) {
        // Token is invalid, disconnect the user
        await supabaseAdmin
          .from('users')
          .update({
            socialConnections: {
              ...(user?.socialConnections || {}),
              facebook: null
            },
            updatedAt: new Date().toISOString()
          })
          .eq('id', userId);

        return NextResponse.json({
          connected: false,
          user: null,
          pages: [],
          instagramAccounts: [],
          error: "Token expired, please reconnect"
        });
      }

      return NextResponse.json({
        connected: true,
        user: {
          id: userInfo.id,
          name: userInfo.name,
          connectedAt: facebookConnection.connectedAt
        },
        pages: [],
        instagramAccounts: []
      });

    } catch (error) {
      console.error("Error verifying Facebook token:", error);
      return NextResponse.json({
        connected: true, // Don't auto-disconnect on network errors
        user: {
          id: facebookConnection.userId,
          name: facebookConnection.userName,
          connectedAt: facebookConnection.connectedAt
        },
        pages: [],
        instagramAccounts: [],
        error: "Unable to verify connection"
      });
    }

  } catch (error) {
    console.error("Facebook status error:", error);
    return NextResponse.json({ error: "Failed to check Facebook status" }, { status: 500 });
  }
}
