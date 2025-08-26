export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename, contentType, teamId } = await request.json();

    // Test environment variables
    const envCheck = {
      S3_BUCKET: process.env.S3_BUCKET,
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? "SET" : "NOT_SET",
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? "SET" : "NOT_SET"
    };

    // Test user sync
    let userSyncResult = null;
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: userId,
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          name: clerkUser.fullName || "",
          image: clerkUser.imageUrl || "",
          updatedAt: new Date().toISOString()
        }, { onConflict: 'clerkId' })
        .select()
        .single();

      userSyncResult = {
        success: !userError,
        user: user ? { id: user.id, email: user.email, name: user.name } : null,
        error: userError
      };
    } catch (error) {
      userSyncResult = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }

    // Test team validation if teamId provided
    let teamValidationResult = null;
    if (teamId) {
      try {
        const { data: team, error: teamError } = await supabaseAdmin
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .single();

        teamValidationResult = {
          success: !teamError,
          team: team ? { id: team.id, name: team.name, ownerId: team.ownerId } : null,
          error: teamError
        };
      } catch (error) {
        teamValidationResult = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    }

    // Test upload locks table
    let uploadLocksResult = null;
    try {
      const { data: locks, error: locksError } = await supabaseAdmin
        .from('upload_locks')
        .select('*')
        .limit(1);

      uploadLocksResult = {
        success: !locksError,
        count: locks?.length || 0,
        error: locksError
      };
    } catch (error) {
      uploadLocksResult = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      userId,
      requestData: { filename, contentType, teamId },
      environment: envCheck,
      userSync: userSyncResult,
      teamValidation: teamValidationResult,
      uploadLocks: uploadLocksResult
    });

  } catch (error) {
    console.error("Debug upload init error:", error);
    return NextResponse.json({
      error: "Debug failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
