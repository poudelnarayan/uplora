export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/email";

export async function GET(req: NextRequest) {
  try {
    // Check all environment variables
    const envCheck = {
      // SMTP Configuration
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_SECURE: process.env.SMTP_SECURE,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS ? "***SET***" : "NOT_SET",
      SMTP_FROM: process.env.SMTP_FROM,
      SMTP_DEBUG: process.env.SMTP_DEBUG,
      
      // Other important vars
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      
      // Check if we're in production
      isProduction: process.env.NODE_ENV === 'production',
      isVercel: !!process.env.VERCEL_ENV,
    };

    // Check if required variables are set
    const missingVars = [];
    if (!process.env.SMTP_HOST) missingVars.push('SMTP_HOST');
    if (!process.env.SMTP_USER) missingVars.push('SMTP_USER');
    if (!process.env.SMTP_PASS) missingVars.push('SMTP_PASS');

    // Test email sending if all vars are present
    let emailTest = null;
    if (missingVars.length === 0) {
      try {
        const testResult = await sendMail({
          to: "debug@uplora.io",
          subject: "🔧 Production Email Debug Test",
          text: `Production email test at ${new Date().toISOString()}
          
Environment: ${process.env.NODE_ENV}
Vercel Environment: ${process.env.VERCEL_ENV}
URL: ${process.env.VERCEL_URL || 'unknown'}

If you receive this, production email is working!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">🔧 Production Email Debug Test</h2>
              <p>Production email test at <strong>${new Date().toISOString()}</strong></p>
              
              <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>Environment Details:</h3>
                <ul>
                  <li><strong>NODE_ENV:</strong> ${process.env.NODE_ENV}</li>
                  <li><strong>VERCEL_ENV:</strong> ${process.env.VERCEL_ENV}</li>
                  <li><strong>VERCEL_URL:</strong> ${process.env.VERCEL_URL || 'unknown'}</li>
                  <li><strong>NEXT_PUBLIC_SITE_URL:</strong> ${process.env.NEXT_PUBLIC_SITE_URL || 'not set'}</li>
                </ul>
              </div>
              
              <p style="color: #059669; font-weight: bold;">
                ✅ If you receive this email, production email is working correctly!
              </p>
            </div>
          `
        });
        
        emailTest = {
          success: true,
          result: testResult
        };
      } catch (emailError) {
        emailTest = {
          success: false,
          error: emailError instanceof Error ? emailError.message : "Unknown email error",
          details: emailError
        };
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        isProduction: process.env.NODE_ENV === 'production',
        isVercel: !!process.env.VERCEL_ENV,
      },
      configuration: envCheck,
      issues: {
        missingVariables: missingVars,
        hasIssues: missingVars.length > 0
      },
      emailTest
    });

  } catch (error) {
    console.error("Production debug error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: error
    }, { status: 500 });
  }
}
