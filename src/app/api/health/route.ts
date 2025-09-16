import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Test Supabase connection
    const { data: supabaseTest, error: supabaseError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    if (supabaseError) {
      throw new Error(`Supabase: ${supabaseError.message}`);
    }

    // Check environment variables
    const envStatus = {
      supabase: {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      clerk: {
        publishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        secretKey: !!process.env.CLERK_SECRET_KEY
      },
      aws: {
        region: !!process.env.AWS_REGION,
        bucket: !!process.env.S3_BUCKET,
        accessKey: !!process.env.AWS_ACCESS_KEY_ID,
        secretKey: !!process.env.AWS_SECRET_ACCESS_KEY
      },
      stripe: {
        publishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        secretKey: !!process.env.STRIPE_SECRET_KEY
      },
      email: {
        smtpHost: !!process.env.SMTP_HOST,
        smtpUser: !!process.env.SMTP_USER,
        smtpPass: !!process.env.SMTP_PASS
      }
    };

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        supabase: "connected",
        database: "accessible"
      },
      environment: envStatus
    });

  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}