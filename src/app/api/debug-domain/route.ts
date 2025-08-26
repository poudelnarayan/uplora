export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: {
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        VERCEL_URL: process.env.VERCEL_URL,
        VERCEL_ENV: process.env.VERCEL_ENV,
        NODE_ENV: process.env.NODE_ENV
      },
      request: {
        hostname: url.hostname,
        protocol: url.protocol,
        fullUrl: url.toString(),
        headers: {
          host: request.headers.get('host'),
          'x-forwarded-host': request.headers.get('x-forwarded-host'),
          'x-forwarded-proto': request.headers.get('x-forwarded-proto')
        }
      }
    });

  } catch (error) {
    console.error("Debug domain error:", error);
    return NextResponse.json({
      error: "Debug failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
