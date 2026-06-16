export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { S3Client, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand, type ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";
import { supabaseAdmin } from "@/lib/supabase";
import { mapToDbStatus, mapFromDbStatus } from "@/lib/postStatus";

const s3 = new S3Client({ region: process.env.AWS_REGION });

async function deleteS3Prefix(prefix: string) {
  let continuationToken: string | undefined = undefined;
  do {
    const listed: ListObjectsV2CommandOutput = await s3.send(
      new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET!,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    const objects = (listed.Contents || []).map((o) => ({ Key: o.Key! }));
    if (objects.length > 0) {
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: process.env.S3_BUCKET!,
          Delete: { Objects: objects },
        })
      );
    }
    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (continuationToken);
}

async function deleteS3KeyOrFolder(key: string, kind: "videos" | "reels" | "images") {
  const m = String(key || "").match(new RegExp(`^(teams\\/[^/]+\\/${kind}\\/[^/]+)\\/`));
  const prefix = m?.[1] ? `${m[1]}/` : null;
  if (prefix) {
    await deleteS3Prefix(prefix);
  } else {
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }));
  }
}

async function findPostById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select(`
      *,
      post_media (
        id,
        media_type,
        s3_key,
        filename,
        content_type,
        size_bytes,
        duration_ms,
        position
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message || 'Failed reading post');
  }
  if (!data) return null;

  return { row: data, type: data.post_type as string };
}

async function ensureAccess(userId: string, row: any): Promise<boolean> {
  if (!row) return false;
  if (row.author_id === userId) return true;
  if (row.team_id) {
    const { data: team } = await supabaseAdmin
      .from('teams')
      .select('id, owner_id')
      .eq('id', row.team_id)
      .single();
    if (team?.owner_id === userId) return true;
    const { data: membership } = await supabaseAdmin
      .from('team_members')
      .select('user_id')
      .eq('team_id', row.team_id)
      .eq('user_id', userId)
      .maybeSingle();
    if (membership) return true;
  }
  return false;
}

type Role = "OWNER" | "ADMIN" | "MANAGER" | "EDITOR" | "MEMBER";
async function getRole(userId: string, row: any): Promise<Role> {
  if (!row) return "MEMBER";
  if (!row.team_id) {
    return row.author_id === userId ? "OWNER" : "MEMBER";
  }

  const { data: team } = await supabaseAdmin
    .from("teams")
    .select("id, owner_id")
    .eq("id", row.team_id)
    .single();
  if (team?.owner_id === userId) return "OWNER";

  const { data: membership } = await supabaseAdmin
    .from("team_members")
    .select("role, status")
    .eq("team_id", row.team_id)
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  const r = (membership as any)?.role;
  if (r === "ADMIN" || r === "MANAGER" || r === "EDITOR") return r;
  return "MEMBER";
}

function formatPostResponse(row: any) {
  const primaryMedia = (row.post_media || [])
    .filter((m: any) => m.media_type !== 'thumbnail')
    .sort((a: any, b: any) => a.position - b.position)[0];
  const thumbnailMedia = (row.post_media || [])
    .find((m: any) => m.media_type === 'thumbnail');

  return {
    ...row,
    type: row.post_type,
    status: mapFromDbStatus(row.status, row.post_type),
    userId: row.author_id,
    teamId: row.team_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    scheduledFor: row.scheduled_for,
    platforms: row.metadata?.platforms || [],
    key: primaryMedia?.s3_key || row.metadata?.key || null,
    filename: primaryMedia?.filename || row.metadata?.filename || null,
    contentType: primaryMedia?.content_type || row.metadata?.content_type || null,
    sizeBytes: primaryMedia?.size_bytes || row.metadata?.size_bytes || null,
    imageKey: row.post_type === 'image' ? (primaryMedia?.s3_key || null) : null,
    videoKey: row.post_type === 'reel' ? (primaryMedia?.s3_key || null) : null,
    thumbnailKey: thumbnailMedia?.s3_key || row.metadata?.thumbnail_key || null,
    description: row.content,
    visibility: row.metadata?.visibility || null,
    madeForKids: row.metadata?.made_for_kids || false,
    requestedByUserId: row.metadata?.requested_by_user_id || null,
    approvedByUserId: row.metadata?.approved_by_user_id || null,
  };
}

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const { id } = context.params;
    const found = await findPostById(id);
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const allowed = await ensureAccess(userId, found.row);
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    return NextResponse.json(formatPostResponse(found.row));
  } catch (e) {
    console.error('GET /api/content/[id] error', e);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const { id } = context.params;
    const body = await req.json();

    const found = await findPostById(id);
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const allowed = await ensureAccess(userId, found.row);
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { content, platforms, title, scheduledFor, status, imageKey, videoKey, metadata, description } = body || {};
    const role = await getRole(userId, found.row);
    const canManagePublishing = ["OWNER", "ADMIN", "MANAGER"].includes(role);

    // Lock pending_approval posts for non-privileged users
    if (!canManagePublishing && found.row?.status === "pending_approval") {
      return NextResponse.json({ error: "Content is pending approval and is locked." }, { status: 423 });
    }

    const now = new Date().toISOString();
    const updateData: any = { updated_at: now };
    const metadataUpdate: any = { ...(found.row.metadata || {}) };

    if (typeof content === 'string') updateData.content = content;
    if (typeof description === 'string') updateData.content = description;
    if (scheduledFor !== undefined) updateData.scheduled_for = scheduledFor;
    if (canManagePublishing && scheduledFor && !status) updateData.status = 'scheduled';
    if (canManagePublishing && typeof status === 'string') {
      updateData.status = mapToDbStatus(status);
    }

    if (Array.isArray(platforms)) metadataUpdate.platforms = platforms;
    if (found.type === 'reel' && typeof title === 'string') metadataUpdate.title = title;
    if (metadata && typeof metadata === 'object') Object.assign(metadataUpdate, metadata);
    updateData.metadata = metadataUpdate;

    // Update media keys in post_media table
    if (found.type === 'image' && (typeof imageKey === 'string' || imageKey === null)) {
      if (imageKey) {
        await upsertPostMedia(id, 'image', imageKey);
      }
    }
    if (found.type === 'reel' && (typeof videoKey === 'string' || videoKey === null)) {
      if (videoKey) {
        await upsertPostMedia(id, 'video', videoKey);
      }
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        post_media (id, media_type, s3_key, filename, content_type, size_bytes, duration_ms, position)
      `)
      .single();

    if (updateError) {
      console.error('Update error', updateError);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json(formatPostResponse(updated));
  } catch (e) {
    console.error('PATCH /api/content/[id] error', e);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const { id } = context.params;
    const found = await findPostById(id);
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const allowed = await ensureAccess(userId, found.row);
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Best-effort S3 cleanup
    try {
      const media = found.row.post_media || [];
      for (const m of media) {
        const key = m.s3_key;
        if (!key) continue;
        if (m.media_type === 'thumbnail') {
          await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }));
        } else if (found.type === 'video') {
          await deleteS3KeyOrFolder(key, 'videos');
        } else if (found.type === 'image') {
          await deleteS3KeyOrFolder(key, 'images');
        } else if (found.type === 'reel') {
          await deleteS3KeyOrFolder(key, 'reels');
        }
      }
      // Also check metadata for legacy keys
      const metaKey = found.row.metadata?.key || found.row.metadata?.thumbnail_key;
      if (metaKey) {
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: metaKey }));
      }
    } catch (s3Err) {
      console.error("S3 cleanup error for content delete", { id, type: found.type, err: s3Err });
    }

    // Delete post_media rows first (FK constraint)
    await supabaseAdmin.from('post_media').delete().eq('post_id', id);

    const { error: delError } = await supabaseAdmin.from('posts').delete().eq('id', id);

    if (delError) {
      console.error('Delete error', delError);
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id, type: found.type });
  } catch (e) {
    console.error('DELETE /api/content/[id] error', e);
    return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
  }
}

async function upsertPostMedia(postId: string, mediaType: string, s3Key: string) {
  const { data: existing } = await supabaseAdmin
    .from('post_media')
    .select('id')
    .eq('post_id', postId)
    .eq('media_type', mediaType)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from('post_media')
      .update({ s3_key: s3Key })
      .eq('id', existing.id);
  } else {
    await supabaseAdmin
      .from('post_media')
      .insert({ post_id: postId, media_type: mediaType, s3_key: s3Key, position: 0 });
  }
}
