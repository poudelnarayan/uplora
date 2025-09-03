export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { broadcast } from "@/lib/realtime";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    console.log("Facebook OAuth callback received:", {
      hasCode: !!code,
      error,
      state
    });

    if (error) {
      console.error("Facebook OAuth error:", error);
      return NextResponse.redirect(new URL("/social?error=facebook_connection_failed", request.url));
    }

    if (!code) {
      console.error("No authorization code received");
      return NextResponse.redirect(new URL("/social?error=facebook_no_code", request.url));
    }

    const { userId } = await auth();
    
    if (!userId) {
      // If no user is authenticated, redirect to sign in with the code
      return NextResponse.redirect(new URL(`/sign-in?redirect_url=${encodeURIComponent(`/social?facebook_code=${code}`)}`, request.url));
    }

    // Determine redirect URI based on environment
    const reqOrigin = (() => { 
      try { 
        return new URL(request.url).origin; 
      } catch { 
        return 'http://localhost:3000'; 
      } 
    })();
    const isLocal = /localhost|127\.0\.0\.1/i.test(reqOrigin);
    const origin = isLocal ? reqOrigin : (process.env.NEXT_PUBLIC_SITE_URL || reqOrigin);
    const redirectUri = isLocal
      ? `${reqOrigin}/api/facebook/connect`
      : (process.env.FB_REDIRECT_URI || `${origin}/api/facebook/connect`);

    console.log('FB_CONNECT_DIAGNOSTIC:', {
      client_id: process.env.META_APP_ID,
      client_secret_set: !!process.env.META_APP_SECRET,
      redirect_uri: redirectUri,
      code_received: !!code,
      userId: userId
    });

    // Exchange code for access token
    const tokenResponse = await fetch("https://graph.facebook.com/v18.0/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error("Facebook token exchange failed:", tokenData);
      return NextResponse.redirect(new URL("/social?error=facebook_token_failed", request.url));
    }

    console.log("Facebook token exchange successful, fetching user info...");

    // Get user's basic Facebook info (only public_profile data)
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${tokenData.access_token}`);
    const userData = await userResponse.json();

    if (!userResponse.ok || userData.error) {
      console.error("Failed to fetch Facebook user data:", userData);
      return NextResponse.redirect(new URL("/social?error=facebook_user_failed", request.url));
    }

    console.log("Facebook user data fetched successfully:", {
      userId: userData.id,
      name: userData.name
    });

    // Store Facebook connection in database (using existing columns or create simple storage)
    try {
      const { supabaseAdmin } = await import("@/lib/supabase");
      
      // For now, let's store Facebook connection info in a simple way
      // You can add proper columns later or use a JSON field
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          // Store in existing fields temporarily or add new columns
          socialConnections: {
            facebook: {
              accessToken: tokenData.access_token,
              userId: userData.id,
              userName: userData.name,
              connectedAt: new Date().toISOString()
            }
          },
          updatedAt: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error("Failed to save Facebook connection:", updateError);
        return NextResponse.redirect(new URL("/social?error=facebook_save_failed", request.url));
      }

      console.log("Facebook connection saved successfully");

      // Broadcast the connection update
              broadcast({
          type: "social.facebook.connected",
          payload: { 
            userId,
            platform: "facebook",
            userName: userData.name
          }
        });

      // Redirect to social page with success
      const redirectUrl = isLocal ? `${reqOrigin}/social?success=facebook_connected` : `${origin}/social?success=facebook_connected`;
      return NextResponse.redirect(new URL(redirectUrl, request.url));

    } catch (error) {
      console.error("Database error:", error);
      return NextResponse.redirect(new URL("/social?error=facebook_connection_failed", request.url));
    }

  } catch (error) {
    console.error("Facebook OAuth callback error:", error);
    return NextResponse.redirect(new URL("/social?error=facebook_connection_failed", request.url));
  }
}
