export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

    // Read full body once
    const body = await req.json();
    let { filename, contentType, sizeBytes, teamId, videoId } = body as { filename: string; contentType: string; sizeBytes?: number; teamId?: string | null; videoId?: string };
    if (!filename || !contentType) return NextResponse.json({ error: "Missing filename/contentType" }, { status: 400 });

    // Ensure user exists early
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        clerkId: userId,
        email: "",
        name: "",
        updatedAt: new Date().toISOString()
      }, { onConflict: 'clerkId' })
      .select()
      .single();

    if (userError) {
      return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
    }

    // Enforce single active upload per user
    const { data: existingLock } = await supabaseAdmin
      .from('uploadLocks')
      .select('*')
      .eq('userId', user.id)
      .single();
    
    if (existingLock) {
      return NextResponse.json({ error: "Another upload is in progress" }, { status: 409 });
    }

    // Build safe file name
    const safeName = String(filename).replace(/[^\w.\- ]+/g, "_");

    // Resolve/validate teamId: fallback to personal team when not provided
    if (!teamId) {
      // Try user.personalTeamId or find personal team owned by user
      const { data: pTeam } = await supabaseAdmin
        .from('teams')
        .select('id')
        .eq('ownerId', user.id)
        .eq('isPersonal', true)
        .single();
      teamId = pTeam?.id || null;
      if (!teamId) {
        return NextResponse.json({ error: "No team found for upload" }, { status: 400 });
      }
    }

    // Validate team access for provided/resolved teamId
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
        const { data: membership, error: memberError } = await supabaseAdmin
          .from('team_members')
          .select('*')
          .eq('teamId', teamId)
          .eq('userId', user.id)
          .single();
        
        if (memberError || !membership) {
          return NextResponse.json({ error: "Not a member of this team" }, { status: 403 });
        }
      }
    }

    // Ensure we have a stable videoId for the canonical key structure
    videoId = videoId || crypto.randomUUID();
    // Use original filename as the object name
    const finalKey = `teams/${teamId}/videos/${videoId}/${safeName}`;

    // Generate presigned PUT URL for final key
    const command = new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: finalKey, ContentType: contentType });
    const putUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });

    // Create upload lock with metadata for completion
    const { error: lockError } = await supabaseAdmin
      .from('uploadLocks')
      .insert({ 
        userId: user.id, 
        key: finalKey,
        metadata: JSON.stringify({
          filename: safeName,
          contentType,
          sizeBytes: Number.isFinite(Number(sizeBytes)) ? Number(sizeBytes) : 0,
          teamId,
          videoId
        })
      });
    
    if (lockError) {
      console.error("Failed to create upload lock:", lockError);
      return NextResponse.json({ error: "Failed to create upload lock" }, { status: 500 });
    }

    return NextResponse.json({ 
      putUrl, 
      key: finalKey, 
      videoId,
      filename: safeName,
      contentType,
      sizeBytes: Number.isFinite(Number(sizeBytes)) ? Number(sizeBytes) : 0,
      teamId
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("presign error", e);
    return NextResponse.json({ error: "Failed to presign", detail: err?.message }, { status: 500 });
  }
}
