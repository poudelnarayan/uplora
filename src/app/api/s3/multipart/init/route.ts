export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { S3Client, CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    let { filename, contentType, teamId, videoId, objectName } = body as { filename: string; contentType: string; teamId?: string | null; videoId?: string; objectName?: string };
    if (!filename || !contentType) {
      return NextResponse.json({ error: "filename and contentType required" }, { status: 400 });
    }

    if (!process.env.S3_BUCKET || !process.env.AWS_REGION) {
      return NextResponse.json({ error: "S3 is not configured (S3_BUCKET/AWS_REGION)" }, { status: 500 });
    }

    const safeName = String(typeof objectName === "string" && objectName.length > 0 ? objectName : filename).replace(/[^\w.\- ]+/g, "_");

    // Get user details from Clerk and sync with Supabase
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        clerk_id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name: clerkUser.fullName || "",
        image: clerkUser.imageUrl || "",
        updated_at: new Date().toISOString()
      }, { onConflict: 'clerk_id' })
      .select()
      .single();

    if (userError || !user) {
      console.error("User sync error:", userError);
      return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
    }

    // Resolve teamId: if not provided, use user's personal team
    if (!teamId) {
      // Try to use personalTeamId from users table
      teamId = (user as any).personal_team_id || null;
      if (!teamId) {
        const { data: pTeam } = await supabaseAdmin
          .from('teams')
          .select('id')
          .eq('owner_id', user.id)
          .eq('is_personal', true)
          .single();
        teamId = pTeam?.id || null;
      }
    }

    if (!teamId) {
      return NextResponse.json({ error: "No team found for upload" }, { status: 400 });
    }

    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, owner_id')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.owner_id !== user.id) {
      const { data: membership } = await supabaseAdmin
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single();
      if (!membership) {
        return NextResponse.json({ error: "Not a member of this team" }, { status: 403 });
      }
    }

    // Generate (or accept) a stable video ID so the S3 layout is predictable.
    // When `videoId` is provided, this enables "replace video" flows for an existing post.
    videoId = typeof videoId === "string" && videoId.length > 0 ? videoId : crypto.randomUUID();

    // Upload directly to the canonical final location using the original filename
    // teams/<teamId>/videos/<videoId>/<filename>
    const finalKey = `teams/${teamId}/videos/${videoId}/${safeName}`;

    // Start multipart upload (with robust error handling)
    let out;
    try {
      const cmd = new CreateMultipartUploadCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: finalKey,
        ContentType: contentType || "application/octet-stream",
      });
      out = await s3.send(cmd);
    } catch (err: any) {
      console.error("S3 CreateMultipartUpload error:", err);
      const message = err?.name ? `${err.name}: ${err.message || 'S3 error'}` : 'S3 CreateMultipartUpload failed';
      return NextResponse.json({ error: message }, { status: 500 });
    }

    // Store upload lock with metadata for completion
    try {
      const { error: lockError } = await supabaseAdmin
        .from('upload_locks')
        .insert({
          user_id: user.id,
          key: finalKey,
          metadata: JSON.stringify({ filename: safeName, contentType, teamId, uploadId: out.UploadId, videoId }),
        });
        
      if (lockError) {
        console.error("Upload lock creation error:", lockError);
        return NextResponse.json({ error: "Failed to create upload lock" }, { status: 500 });
      }
    } catch (error) {
      console.error("Upload lock creation exception:", error);
      return NextResponse.json({ error: "Failed to create upload lock" }, { status: 500 });
    }

    return NextResponse.json({ 
      uploadId: out.UploadId, 
      key: finalKey, 
      partSize: 16 * 1024 * 1024, 
      videoId,
      filename: safeName,
      contentType,
      teamId
    });
  } catch (e: any) {
    console.error("Multipart init error:", e);
    const message = e?.message || 'Init failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


