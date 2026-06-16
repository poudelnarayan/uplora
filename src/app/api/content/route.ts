import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";
import { mapToDbStatus, mapFromDbStatus } from "@/lib/postStatus";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'Authentication required'),
        { status: 401 }
      );
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'User not found'),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    let teamId = searchParams.get('teamId');
    const types = searchParams.get('types')?.split(',') || ['video', 'image', 'text', 'reel'];
    const status = searchParams.get('status') || 'ALL';
    const sortBy = searchParams.get('sortBy') || 'newest';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!teamId) {
      const { data: pTeam } = await supabaseAdmin
        .from('teams')
        .select('id')
        .eq('owner_id', user.id)
        .eq('is_personal', true)
        .single();
      teamId = pTeam?.id || null;
    }

    if (!teamId) {
      return NextResponse.json(
        createErrorResponse('TEAM_NOT_FOUND', 'No team found for this user'),
        { status: 400 }
      );
    }

    // Validate team access
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        createErrorResponse('TEAM_NOT_FOUND', 'Team not found'),
        { status: 404 }
      );
    }

    if (team.owner_id !== user.id) {
      const { data: membership } = await supabaseAdmin
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        return NextResponse.json(
          createErrorResponse('ACCESS_DENIED', 'Not a member of this team'),
          { status: 403 }
        );
      }
    }

    // Build query on unified posts table
    let query = supabaseAdmin
      .from('posts')
      .select(`
        id,
        post_type,
        content,
        status,
        scheduled_for,
        published_at,
        folder_path,
        metadata,
        author_id,
        team_id,
        created_at,
        updated_at,
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
      .eq('team_id', teamId)
      .in('post_type', types);

    if (status !== 'ALL') {
      const mappedStatus = mapToDbStatus(status);
      query = query.eq('status', mappedStatus);
    }

    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'title':
        query = query.order('content', { ascending: true });
        break;
      case 'status':
        query = query.order('status', { ascending: true });
        break;
    }

    const { data: posts, error: postsError } = await query.range(offset, offset + limit - 1);

    if (postsError) {
      console.error('Posts fetch error:', postsError);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to fetch content'),
        { status: 500 }
      );
    }

    // Fetch uploader info
    const userIds = [...new Set((posts || []).map((p: any) => p.author_id).filter(Boolean))];
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name, email, image')
      .in('id', userIds);

    const userMap = new Map(users?.map(u => [u.id, u]) || []);

    const content = (posts || []).map((post: any) => {
      const primaryMedia = (post.post_media || [])
        .filter((m: any) => m.media_type !== 'thumbnail')
        .sort((a: any, b: any) => a.position - b.position)[0];
      const thumbnailMedia = (post.post_media || [])
        .find((m: any) => m.media_type === 'thumbnail');

      const thumbnailKey = thumbnailMedia?.s3_key || post.metadata?.thumbnail_key || null;
      const mediaKey = primaryMedia?.s3_key || post.metadata?.key || null;

      return {
        id: post.id,
        type: post.post_type,
        content: post.content,
        status: mapFromDbStatus(post.status, post.post_type),
        platforms: post.metadata?.platforms || [],
        scheduledFor: post.scheduled_for,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        teamId: post.team_id,
        userId: post.author_id,
        metadata: post.metadata,
        folderPath: post.folder_path,
        // type-specific convenience fields
        title: post.post_type === 'reel'
          ? (post.metadata?.title || post.content?.substring(0, 50) || 'Reel')
          : post.content?.substring(0, 50) || `${post.post_type} Post`,
        // media
        key: mediaKey,
        filename: primaryMedia?.filename || post.metadata?.filename || null,
        contentType: primaryMedia?.content_type || post.metadata?.content_type || null,
        sizeBytes: primaryMedia?.size_bytes || post.metadata?.size_bytes || null,
        imageKey: post.post_type === 'image' ? mediaKey : null,
        videoKey: (post.post_type === 'video' || post.post_type === 'reel') ? mediaKey : null,
        thumbnailKey,
        // `thumbnail` is meant to be used as <img src>. We append `redirect=1`
        // so the route 302s to the actual signed S3 URL instead of returning
        // JSON. Falling back to `mediaKey` for non-image posts would be
        // pointing at a video file (which <img> can't render), so we restrict
        // the fallback to image posts only.
        thumbnail: thumbnailKey
          ? `/api/s3/get-url?redirect=1&key=${encodeURIComponent(thumbnailKey)}`
          : (post.post_type === 'image' && mediaKey)
            ? `/api/s3/get-url?redirect=1&key=${encodeURIComponent(mediaKey)}`
            : null,
        // video-specific fields
        description: post.content,
        visibility: post.metadata?.visibility || null,
        madeForKids: post.metadata?.made_for_kids || false,
        requestedByUserId: post.metadata?.requested_by_user_id || null,
        approvedByUserId: post.metadata?.approved_by_user_id || null,
        uploader: userMap.get(post.author_id),
      };
    });

    // Sort combined results
    if (sortBy === 'newest') {
      content.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      content.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    return NextResponse.json(
      createSuccessResponse({
        content,
        total: content.length,
        hasMore: content.length === limit
      })
    );

  } catch (error) {
    console.error('Content fetch error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to fetch content'),
      { status: 500 }
    );
  }
}

