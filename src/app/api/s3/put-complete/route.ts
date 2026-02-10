export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";
import { S3Client, HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const DEFAULT_MAX_UPLOAD_BYTES = 5 * 1024 * 1024 * 1024; // 5GB
const maxFromEnv = Number(process.env.MAX_UPLOAD_BYTES || process.env.MAX_VIDEO_UPLOAD_BYTES);
const MAX_UPLOAD_BYTES = Number.isFinite(maxFromEnv) && maxFromEnv > 0 ? maxFromEnv : DEFAULT_MAX_UPLOAD_BYTES;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Auth required" }, { status: 401 });
    }

    const { key, filename, contentType, sizeBytes, teamId } = await req.json();
    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    // Get user details from Clerk and sync with Supabase
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    const userName = clerkUser.fullName || clerkUser.firstName || "";
    const userImage = clerkUser.imageUrl || "";

    // Ensure user exists in Supabase
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        clerkId: userId,
        email: userEmail || "", 
        name: userName, 
        image: userImage,
        updatedAt: new Date().toISOString()
      }, {
        onConflict: 'clerkId'
      })
      .select()
      .single();

    if (userError) {
      console.error("User sync error:", userError);
      return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
    }

    // Derive teamId and videoId from key (teams/<teamId>/videos/<videoId>/...)
    const m = key.match(/teams\/([^/]+)\/videos\/([^/]+)\//);
    const teamIdFromKey = m?.[1] || null;
    const videoIdFromKey = m?.[2] || null;
    const finalTeamId = teamId ?? teamIdFromKey;

    // Validate team access if teamId is provided
    if (finalTeamId) {
      // Check if user is the team owner
      const { data: team, error: teamError } = await supabaseAdmin
        .from('teams')
        .select('*')
        .eq('id', finalTeamId)
        .eq('ownerId', user.id)
        .single();
      
      if (teamError || !team) {
        // If not owner, check if user is a team member
        const { data: membership, error: membershipError } = await supabaseAdmin
          .from('team_members')
          .select('*')
          .eq('teamId', finalTeamId)
          .eq('userId', user.id)
          .single();
        
        if (membershipError || !membership) {
          return NextResponse.json({ error: "Not a member of this team" }, { status: 403 });
        }
      }
    }

    // Load upload lock metadata (if present) to validate size
    const { data: uploadLock } = await supabaseAdmin
      .from('upload_locks')
      .select('*')
      .eq('userId', user.id)
      .eq('key', key)
      .maybeSingle();

    const lockMeta: { sizeBytes?: number } = uploadLock?.metadata ? JSON.parse(uploadLock.metadata) : {};
    const expectedSize = Number.isFinite(Number(lockMeta.sizeBytes ?? sizeBytes))
      ? Number(lockMeta.sizeBytes ?? sizeBytes)
      : null;

    // Validate actual uploaded size against expected/max
    let actualSize = 0;
    try {
      const head = await s3.send(new HeadObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }));
      actualSize = Number(head.ContentLength || 0);
    } catch (headError) {
      console.error("Failed to head uploaded object:", headError);
      return NextResponse.json({ error: "Upload validation failed" }, { status: 500 });
    }

    if (!actualSize) {
      return NextResponse.json({ error: "Uploaded file has no size" }, { status: 400 });
    }

    if (actualSize > MAX_UPLOAD_BYTES) {
      try { await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key })); } catch {}
      await supabaseAdmin.from('upload_locks').delete().eq('userId', user.id).eq('key', key);
      return NextResponse.json({ error: "File too large", maxBytes: MAX_UPLOAD_BYTES }, { status: 413 });
    }

    if (expectedSize !== null && actualSize !== expectedSize) {
      try { await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key })); } catch {}
      await supabaseAdmin.from('upload_locks').delete().eq('userId', user.id).eq('key', key);
      return NextResponse.json({ error: "Uploaded size mismatch" }, { status: 400 });
    }

    // Create the video record only after successful upload completion
    const title = String(filename || "").replace(/\.[^/.]+$/, "") || "Untitled";
    const now = new Date().toISOString();
    
    const newVideoId = videoIdFromKey || crypto.randomUUID();
    const { data: video, error: videoError } = await supabaseAdmin
      .from('video_posts')
      .insert({
        id: newVideoId,
        key,
        filename: title,
        contentType: contentType || "application/octet-stream",
        sizeBytes: actualSize || (typeof sizeBytes === "number" ? sizeBytes : 0),
        teamId: finalTeamId,
        userId: user.id,
        status: "PROCESSING",
        uploadedAt: now,
        updatedAt: now
      })
      .select()
      .single();

    if (videoError) {
      console.error("Video creation error:", videoError);
      return NextResponse.json({ error: "Failed to create video record" }, { status: 500 });
    }

    // Broadcast video creation event
    broadcast({ 
      type: "video.created", 
      teamId: video.teamId || null, 
      payload: { id: video.id, title: video.filename }
    });

    // Release upload lock for this user
    await supabaseAdmin
      .from('upload_locks')
      .delete()
      .eq('userId', user.id)
      .eq('key', key);

    return NextResponse.json({ success: true, videoId: video.id });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("put complete error", e);
    return NextResponse.json({ 
      error: "Failed to complete upload", 
      detail: err?.message 
    }, { status: 500 });
  }
}
