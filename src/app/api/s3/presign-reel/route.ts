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

    const body = await req.json();
    const { filename, contentType, sizeBytes } = body as { 
      filename: string; 
      contentType: string; 
      sizeBytes?: number; 
      teamId?: string | null; 
    };
    let { teamId } = body as { teamId?: string | null };
    
    if (!filename || !contentType) {
      return NextResponse.json({ error: "Missing filename/contentType" }, { status: 400 });
    }

    // Validate video content type
    const supportedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!supportedTypes.includes(contentType)) {
      return NextResponse.json({ error: "Only MP4, MOV, AVI, or WebM videos are allowed" }, { status: 400 });
    }

    // Ensure user exists
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

    // Resolve/validate teamId: fallback to personal team when not provided
    if (!teamId) {
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

    // Validate team access
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

    // Build safe file name
    const safeName = String(filename).replace(/[^\w.\- ]+/g, "_");
    const reelId = crypto.randomUUID();
    
    // Create S3 key with the correct path structure
    const s3Key = `teams/${teamId}/reels/${reelId}/${safeName}`;

    // Generate presigned PUT URL
    const command = new PutObjectCommand({ 
      Bucket: process.env.S3_BUCKET!, 
      Key: s3Key, 
      ContentType: contentType 
    });
    const putUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 }); // 5 minutes

    return NextResponse.json({
      putUrl,
      key: s3Key,
      reelId,
      expiresIn: 300
    });

  } catch (error) {
    console.error("Reel presign error:", error);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
