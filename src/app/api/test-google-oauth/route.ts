export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Check Google OAuth environment variables
    const googleConfig = {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "***SET***" : "NOT_SET",
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    };

    // Check if required variables are set
    const missingVars = [];
    if (!process.env.GOOGLE_CLIENT_ID) missingVars.push('GOOGLE_CLIENT_ID');
    if (!process.env.GOOGLE_CLIENT_SECRET) missingVars.push('GOOGLE_CLIENT_SECRET');

    // Build OAuth URLs for testing
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://uplora.io';
    const redirectUri = `${baseUrl}/api/auth/callback/google`;
    
    const oauthUrls = {
      authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly')}&` +
        `access_type=offline&` +
        `prompt=consent`,
      redirectUri,
      baseUrl
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        isProduction: process.env.NODE_ENV === 'production',
      },
      configuration: googleConfig,
      oauthUrls,
      issues: {
        missingVariables: missingVars,
        hasIssues: missingVars.length > 0
      },
      recommendations: [
        "1. Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in Vercel environment variables",
        "2. Verify authorized domains in Google Cloud Console include 'uplora.io'",
        "3. Check that redirect URIs include 'https://uplora.io/api/auth/callback/google'",
        "4. Ensure YouTube Data API v3 is enabled in Google Cloud Console",
        "5. Verify OAuth consent screen is properly configured"
      ]
    });

  } catch (error) {
    console.error("Google OAuth test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: error
    }, { status: 500 });
  }
}
