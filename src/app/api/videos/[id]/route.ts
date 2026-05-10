export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";
import { getVideoById, syncUser, getTeamAndRole, updateVideoMetadata, videoStatusToDb } from "@/lib/video-utils";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });
    const { id } = context.params;

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const user = await syncUser(userId, clerkUser);

    const video = await getVideoById(id);
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    // Access check
    let hasAccess = video.userId === user.id;
    if (!hasAccess && video.teamId) {
      const { team, role } = await getTeamAndRole(video.teamId, user.id);
      hasAccess = !!role;
    }

    if (!hasAccess) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    // Resolve uploader profile so the preview can show name/email/image
    // (instead of just an id, which made the "Uploaded by" line look empty).
    let uploader: { id: string; name: string | null; email: string | null; image: string | null } = {
      id: video.userId,
      name: null,
      email: null,
      image: null,
    };
    if (video.userId) {
      const { data: u } = await supabaseAdmin
        .from("users")
        .select("id, name, email, image")
        .eq("id", video.userId)
        .maybeSingle();
      if (u) {
        uploader = { id: u.id, name: u.name ?? null, email: u.email ?? null, image: u.image ?? null };
      }
    }

    return NextResponse.json({
      id: video.id,
      key: video.key,
      filename: video.filename,
      contentType: video.contentType,
      status: video.status,
      uploadedAt: video.createdAt,
      updatedAt: video.updatedAt,
      teamId: video.teamId || undefined,
      requestedByUserId: video.requestedByUserId,
      approvedByUserId: video.approvedByUserId,
      description: video.description || "",
      visibility: video.visibility || "public",
      madeForKids: video.madeForKids,
      thumbnailKey: video.thumbnailKey,
      tags: video.tags || [],
      categoryId: video.categoryId || null,
      youtubeVideoId: video.youtubeVideoId,
      youtubeThumbnailUploadStatus: video.youtubeThumbnailUploadStatus,
      youtubeThumbnailUploadError: video.youtubeThumbnailUploadError,
      uploader,
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to get video" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });
    const { id } = context.params;
    const body = await req.json();

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const user = await syncUser(userId, clerkUser);

    const video = await getVideoById(id);
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    let hasAccess = video.userId === user.id;
    let team: any = null;
    if (!hasAccess && video.teamId) {
      const res = await getTeamAndRole(video.teamId, user.id);
      team = res.team;
      hasAccess = !!res.role;
    }

    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Lock if pending/approved (only owner can edit)
    const lockedStatuses = ['pending_approval', 'approved'];
    if (lockedStatuses.includes(video.dbStatus)) {
      let isOwner = video.userId === user.id;
      if (video.teamId && !isOwner) {
        if (!team) {
          const res = await getTeamAndRole(video.teamId, user.id);
          team = res.team;
        }
        if (team?.owner_id === user.id) isOwner = true;
      }
      if (!isOwner) {
        return NextResponse.json({ error: "Video is locked for review/publish. Only the owner can edit." }, { status: 403 });
      }
    }

    const { title, description, visibility, madeForKids, thumbnailKey, status, tags, categoryId } = body as {
      title?: string; description?: string; visibility?: string;
      madeForKids?: boolean; thumbnailKey?: string | null; status?: string;
      tags?: string[] | null; categoryId?: string | null;
    };

    const now = new Date().toISOString();
    const postUpdate: any = { updated_at: now };
    const metaUpdate: any = { ...video.metadata };

    if (typeof description === 'string') postUpdate.content = description;
    if (typeof title === 'string' && title.length) {
      metaUpdate.filename = title;
      postUpdate.content = postUpdate.content ?? description ?? video.description;
    }
    if (typeof visibility === 'string') metaUpdate.visibility = visibility;
    if (typeof madeForKids === 'boolean') metaUpdate.made_for_kids = madeForKids;

    // Tags: cap to YouTube's 500 limit, filter empties + length, dedupe
    if (Array.isArray(tags) || tags === null) {
      if (tags === null) {
        metaUpdate.tags = [];
      } else {
        const cleaned = Array.from(
          new Set(
            tags
              .map((t) => (typeof t === 'string' ? t.trim() : ''))
              .filter((t) => t.length > 0 && t.length <= 30)
          )
        ).slice(0, 500);
        metaUpdate.tags = cleaned;
      }
    }
    if (typeof categoryId === 'string' || categoryId === null) {
      metaUpdate.category_id = categoryId || null;
    }

    // Update thumbnail in post_media
    if (typeof thumbnailKey === 'string' || thumbnailKey === null) {
      if (thumbnailKey) {
        const { data: existingThumb } = await supabaseAdmin
          .from('post_media')
          .select('id')
          .eq('post_id', id)
          .eq('media_type', 'thumbnail')
          .maybeSingle();

        if (existingThumb) {
          await supabaseAdmin.from('post_media').update({ s3_key: thumbnailKey }).eq('id', existingThumb.id);
        } else {
          await supabaseAdmin.from('post_media').insert({
            post_id: id, media_type: 'thumbnail', s3_key: thumbnailKey, position: 0,
          });
        }
      } else if (thumbnailKey === null) {
        await supabaseAdmin.from('post_media').delete().eq('post_id', id).eq('media_type', 'thumbnail');
      }
    }

    // Owner can revert to PROCESSING
    let statusData: any = null;
    if (typeof status === 'string') {
      let isOwnerOfVideo = video.userId === user.id;
      if (!isOwnerOfVideo && video.teamId) {
        if (!team) { const res = await getTeamAndRole(video.teamId, user.id); team = res.team; }
        if (team?.owner_id === user.id) isOwnerOfVideo = true;
      }
      if (isOwnerOfVideo && status.toUpperCase() === 'PROCESSING') {
        postUpdate.status = 'draft';
        metaUpdate.video_status = 'PROCESSING';
        metaUpdate.requested_by_user_id = null;
        metaUpdate.approved_by_user_id = null;
        statusData = 'PROCESSING';
      }
    }

    postUpdate.metadata = metaUpdate;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('posts')
      .update(postUpdate)
      .eq('id', id)
      .select('*, post_media(*)')
      .single();

    if (updateError) return NextResponse.json({ error: "Failed to update video" }, { status: 500 });

    if (statusData) {
      broadcast({ type: "video.status", teamId: video.teamId || null, payload: { id, status: statusData } });
    } else {
      broadcast({ type: "video.updated", teamId: video.teamId || null, payload: { id } });
    }

    return NextResponse.json({ ok: true, video: updated });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update video" }, { status: 500 });
  }
}
