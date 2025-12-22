export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand, type ListObjectsV2CommandOutput, type _Object } from "@aws-sdk/client-s3";
import { broadcast } from "@/lib/realtime";

// PATCH: update team (owner-only)
export async function PATCH(
  request: NextRequest,
  context: { params: { teamId: string } }
) {
  try {
    const { teamId } = context.params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const description = typeof body.description === "string" ? body.description.trim() : undefined;
    const platforms = Array.isArray(body.platforms)
      ? body.platforms.filter((p: unknown) => typeof p === "string").map((p: string) => p.trim()).filter(Boolean)
      : undefined;

    if (!name && !description && platforms === undefined) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerkId', userId)
      .single();
    
    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();
    
    if (teamError || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    
    if (team.ownerId !== user.id) {
      return NextResponse.json({ error: "Only the owner can update this team" }, { status: 403 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (platforms !== undefined) updateData.platforms = platforms;
    
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('teams')
      .update(updateData)
      .eq('id', team.id)
      .select('id, name, description, platforms, updatedAt')
      .single();
    
    if (updateError) {
      return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
    }
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}

// DELETE: delete team (owner-only)
export async function DELETE(
  request: NextRequest,
  context: { params: { teamId: string } }
) {
  try {
    const { teamId } = context.params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerkId', userId)
      .single();
    
    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();
    
    if (teamError || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    
    if (team.ownerId !== user.id) {
      return NextResponse.json({ error: "Only the owner can delete this team" }, { status: 403 });
    }

    // Best-effort: delete all S3 objects under this team's prefix
    try {
      const bucket = process.env.S3_BUCKET;
      const region = process.env.AWS_REGION;
      if (bucket && region) {
        const s3 = new S3Client({ region });
        const prefix = `teams/${team.id}/`;
        let continuationToken: string | undefined = undefined;
        do {
          const listResp: ListObjectsV2CommandOutput = await s3.send(
            new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: continuationToken })
          );
          const keys = (listResp.Contents || [])
            .map((o: _Object) => o.Key)
            .filter((k): k is string => Boolean(k));
          if (keys.length > 0) {
            await s3.send(
              new DeleteObjectsCommand({
                Bucket: bucket,
                Delete: { Objects: keys.map((Key: string) => ({ Key })) },
              })
            );
          }
          continuationToken = listResp.IsTruncated ? listResp.NextContinuationToken : undefined;
        } while (continuationToken);
      }
    } catch {}

    const { error: deleteError } = await supabaseAdmin
      .from('teams')
      .delete()
      .eq('id', team.id);
    
    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
    }
    // Broadcast deletion so clients refresh their team lists/dropdowns
    broadcast({ type: "team.deleted", payload: { id: team.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}


