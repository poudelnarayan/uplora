export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

type ContentType = 'text' | 'image' | 'reel';

async function findPostById(id: string) {
  // Try each table until found
  const tables: Array<{ name: string; type: ContentType }> = [
    { name: 'text_posts', type: 'text' },
    { name: 'image_posts', type: 'image' },
    { name: 'reel_posts', type: 'reel' },
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

    const { content, platforms, title, scheduledFor, status, imageKey, videoKey, metadata } = body || {};

    const updateData: any = { updatedAt: new Date().toISOString() };
    if (typeof content === 'string') updateData.content = content;
    if (Array.isArray(platforms)) updateData.platforms = platforms;
    if (found.type === 'reel' && typeof title === 'string') updateData.title = title;
    if (found.type === 'image' && (typeof imageKey === 'string' || imageKey === null)) updateData.imageKey = imageKey;
    if (found.type === 'reel' && (typeof videoKey === 'string' || videoKey === null)) updateData.videoKey = videoKey;
    if (scheduledFor !== undefined) updateData.scheduledFor = scheduledFor;
    if (typeof status === 'string') updateData.status = status;
    if (metadata && typeof metadata === 'object') updateData.metadata = metadata;

    // Auto set status to SCHEDULED when scheduling provided and not explicitly overridden
    if (scheduledFor && !status) updateData.status = 'SCHEDULED';

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

    const { error: delError } = await supabaseAdmin
      .from(found.table)
      .delete()
      .eq('id', id);

    if (delError) {
      console.error('Delete error', delError);
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/content/[id] error', e);
    return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
  }
}



