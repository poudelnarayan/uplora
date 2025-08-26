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

    const { filename, contentType, teamId } = await req.json();
    if (!filename || !contentType) {
      return NextResponse.json({ error: "filename and contentType required" }, { status: 400 });
    }

    if (!process.env.S3_BUCKET || !process.env.AWS_REGION) {
      return NextResponse.json({ error: "S3 is not configured (S3_BUCKET/AWS_REGION)" }, { status: 500 });
    }

    const safeName = String(filename).replace(/[^\w.\- ]+/g, "_");

    // Get user details from Clerk and sync with Supabase
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

    if (userError) {
      return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
    }

    // Validate team access if teamId provided
    if (teamId) {
      const { data: team, error: teamError } = await supabaseAdmin
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();
        
      if (teamError || !team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }
      
      if (team.ownerId !== user.id) {
        const { data: membership } = await supabaseAdmin
          .from('team_members')
          .select('*')
          .eq('teamId', teamId)
          .eq('userId', user.id)
          .single();
          
        if (!membership) {
          return NextResponse.json({ error: "Not a member of this team" }, { status: 403 });
        }
      }
    }

    // Generate a temporary upload ID (not a video ID)
    const uploadId = crypto.randomUUID();

    // Compute final key using upload ID
    const finalKey = teamId
      ? `teams/${teamId}/videos/${uploadId}/original/${safeName}`
      : `users/${user.id}/videos/${uploadId}/original/${safeName}`;

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
      const message = err?.name ? `${err.name}: ${err.message || 'S3 error'}` : 'S3 CreateMultipartUpload failed';
      return NextResponse.json({ error: message }, { status: 500 });
    }

    // Store upload lock with metadata for completion
    try {
      const { error: lockError } = await supabaseAdmin
        .from('upload_locks')
        .insert({
          userId: user.id, 
          key: finalKey,
          metadata: JSON.stringify({
            filename: safeName,
            contentType,
            teamId,
            uploadId: out.UploadId
          })
        });
        
      if (lockError) {
        console.error("Upload lock creation error:", lockError);
        return NextResponse.json({ error: "Failed to create upload lock" }, { status: 500 });
      }
    } catch {}

    return NextResponse.json({ 
      uploadId: out.UploadId, 
      key: finalKey, 
      partSize: 8 * 1024 * 1024, 
      tempId: uploadId,
      filename: safeName,
      contentType,
      teamId
    });
  } catch (e: any) {
    const message = e?.message || 'Init failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


