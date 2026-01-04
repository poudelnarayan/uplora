export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { S3Client, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { supabaseAdmin } from "@/lib/supabase";

type ContentType = "text" | "image" | "reel" | "video";

const s3 = new S3Client({ region: process.env.AWS_REGION });

async function deleteS3Prefix(prefix: string) {
  let continuationToken: string | undefined = undefined;
  do {
    const listed = await s3.send(
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
  // Try each table until found
  const tables: Array<{ name: string; type: ContentType }> = [
    { name: "video_posts", type: "video" },
    { name: "text_posts", type: "text" },
    { name: "image_posts", type: "image" },
    { name: "reel_posts", type: "reel" },
  ];

  for (const t of tables) {
    const { data, error } = await supabaseAdmin
      .from(t.name)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (data) return { table: t.name, type: t.type, row: data };
    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message || `Failed reading ${t.name}`);
    }
  }
  return null;
}

async function ensureAccess(userId: string, row: any): Promise<boolean> {
  if (!row) return false;
  if (row.userId === userId) return true;
  if (row.teamId) {
    const { data: team } = await supabaseAdmin
      .from('teams')
      .select('id, ownerId')
      .eq('id', row.teamId)
      .single();
    if (team?.ownerId === userId) return true;
    const { data: membership } = await supabaseAdmin
      .from('team_members')
      .select('userId')
      .eq('teamId', row.teamId)
      .eq('userId', userId)
      .maybeSingle();
    if (membership) return true;
  }
  return false;
}

type Role = "OWNER" | "ADMIN" | "MANAGER" | "EDITOR" | "MEMBER";
async function getRole(userId: string, row: any): Promise<Role> {
  if (!row) return "MEMBER";
  // Personal content: creator can manage it.
  if (!row.teamId) {
    return row.userId === userId ? "OWNER" : "MEMBER";
  }

  const { data: team } = await supabaseAdmin
    .from("teams")
    .select("id, ownerId")
    .eq("id", row.teamId)
    .single();
  if (team?.ownerId === userId) return "OWNER";

  const { data: membership } = await supabaseAdmin
    .from("team_members")
    .select("role, status")
    .eq("teamId", row.teamId)
    .eq("userId", userId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  const r = (membership as any)?.role;
  if (r === "ADMIN" || r === "MANAGER" || r === "EDITOR") return r;
  return "MEMBER";
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

    return NextResponse.json({ ...found.row, type: found.type });
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

    // Editors (and other non-privileged roles) must use the approval flow.
    // Once a post is PENDING, editors should not be able to modify it until approved/sent back.
    if (!canManagePublishing && String(found.row?.status || "").toUpperCase() === "PENDING") {
      return NextResponse.json({ error: "Content is pending approval and is locked." }, { status: 423 });
    }

    const updateData: any = { updatedAt: new Date().toISOString() };
    if (typeof content === 'string') updateData.content = content;
    if (found.type === "video" && typeof description === "string") updateData.description = description;
    if (Array.isArray(platforms)) updateData.platforms = platforms;
    if (found.type === 'reel' && typeof title === 'string') updateData.title = title;
    if (found.type === 'image' && (typeof imageKey === 'string' || imageKey === null)) updateData.imageKey = imageKey;
    if (found.type === 'reel' && (typeof videoKey === 'string' || videoKey === null)) updateData.videoKey = videoKey;
    if (scheduledFor !== undefined) updateData.scheduledFor = scheduledFor;
    // Only privileged roles can change status directly.
    if (canManagePublishing && typeof status === 'string') updateData.status = status;
    if (metadata && typeof metadata === 'object') updateData.metadata = metadata;

    // Auto set status to SCHEDULED when scheduling provided and not explicitly overridden
    if (canManagePublishing && scheduledFor && !status) updateData.status = 'SCHEDULED';

    const { data: updated, error: updateError } = await supabaseAdmin
      .from(found.table)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error', updateError);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ ...updated, type: found.type });
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

    // Best-effort: delete associated media from S3 first
    try {
      if (found.type === "video") {
        const key = String((found.row as any)?.key || "");
        const thumbnailKey = (found.row as any)?.thumbnailKey as string | null | undefined;
        if (key) await deleteS3KeyOrFolder(key, "videos");
        if (thumbnailKey) {
          await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: thumbnailKey }));
        }
      } else if (found.type === "image") {
        const key = (found.row as any)?.imageKey as string | null | undefined;
        if (key) await deleteS3KeyOrFolder(key, "images");
      } else if (found.type === "reel") {
        const key = (found.row as any)?.videoKey as string | null | undefined;
        const thumbnailKey = (found.row as any)?.thumbnailKey as string | null | undefined;
        if (key) await deleteS3KeyOrFolder(key, "reels");
        if (thumbnailKey) {
          await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: thumbnailKey }));
        }
      }
    } catch (s3Err) {
      console.error("S3 cleanup error for content delete", { id, type: found.type, err: s3Err });
      // Continue; DB delete still happens.
    }

    const { error: delError } = await supabaseAdmin.from(found.table).delete().eq("id", id);

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



