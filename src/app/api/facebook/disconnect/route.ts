export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Disconnecting Facebook for user:", userId);

    // Get current user data first
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('socialConnections')
      .eq('id', userId)
      .single();

    // Remove Facebook connection from database
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        socialConnections: {
          ...(currentUser?.socialConnections || {}),
          facebook: null,
          instagram: null
        },
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error("Failed to disconnect Facebook:", updateError);
      return NextResponse.json({ error: "Failed to disconnect Facebook" }, { status: 500 });
    }

    console.log("Facebook disconnected successfully");

    // Broadcast the disconnection
    broadcast({
      type: "social.facebook.disconnected",
      payload: { userId, platform: "facebook" }
    });

    return NextResponse.json({ success: true, message: "Facebook disconnected successfully" });

  } catch (error) {
    console.error("Facebook disconnect error:", error);
    return NextResponse.json({ error: "Failed to disconnect Facebook" }, { status: 500 });
  }
}
