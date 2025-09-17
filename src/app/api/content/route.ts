import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-utils";

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

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerkId', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'User not found'),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
      const teamId = searchParams.get('teamId');
      const types = searchParams.get('types')?.split(',') || ['video', 'image', 'text', 'reel'];
      const status = searchParams.get('status') || 'ALL';
      const sortBy = searchParams.get('sortBy') || 'newest';
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');

      // Validate team access
      if (teamId) {
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
        
        if (team.ownerId !== user.id) {
          const { data: membership, error: memberError } = await supabaseAdmin
            .from('team_members')
            .select('*')
            .eq('teamId', teamId)
            .eq('userId', user.id)
            .single();
          
          if (memberError || !membership) {
            return NextResponse.json(
              createErrorResponse('ACCESS_DENIED', 'Not a member of this team'),
              { status: 403 }
            );
          }
        }
      }

      const allContent = [];

      // Fetch videos
      if (types.includes('video')) {
        let videoQuery = supabaseAdmin
          .from('video_posts')
          .select(`
            id,
            key,
            filename,
            contentType,
            sizeBytes,
            status,
            description,
            visibility,
            madeForKids,
            updatedAt,
            thumbnailKey,
            userId,
            teamId
          `)
          .eq('teamId', teamId);

        if (status !== 'ALL') {
          videoQuery = videoQuery.eq('status', status);
        }

          // Apply sorting
          switch (sortBy) {
            case 'newest':
              videoQuery = videoQuery.order('updatedAt', { ascending: false });
              break;
            case 'oldest':
              videoQuery = videoQuery.order('updatedAt', { ascending: true });
              break;
            case 'title':
              videoQuery = videoQuery.order('filename', { ascending: true });
              break;
            case 'status':
              videoQuery = videoQuery.order('status', { ascending: true });
              break;
          }

        const { data: videos, error: videoError } = await videoQuery
          .range(offset, offset + limit - 1);

        if (videoError) {
          console.error('Video fetch error:', videoError);
        } else {
          allContent.push(...(videos || []).map(video => ({
            ...video,
            type: 'video' as const,
            title: video.description || video.filename || 'Video Post',
            content: video.description || video.filename || 'Video content',
            createdAt: video.updatedAt, // Use updatedAt as createdAt for videos
            platforms: [], // Videos don't have platforms in this table
            scheduledFor: null, // Videos don't have scheduledFor in this table
            metadata: null, // Videos don't have metadata in this table
            thumbnail: video.thumbnailKey ? `/api/s3/get-url?key=${encodeURIComponent(video.thumbnailKey)}` : null
          })));
        }
      }

      // Fetch image posts
      if (types.includes('image')) {
        let imageQuery = supabaseAdmin
          .from('image_posts')
          .select(`
            id,
            content,
            status,
            platforms,
            createdAt,
            updatedAt,
            scheduledFor,
            imageKey,
            metadata,
            userId,
            teamId
          `)
          .eq('teamId', teamId);

        if (status !== 'ALL') {
          imageQuery = imageQuery.eq('status', status);
        }

        // Apply sorting
        switch (sortBy) {
          case 'newest':
            imageQuery = imageQuery.order('createdAt', { ascending: false });
            break;
          case 'oldest':
            imageQuery = imageQuery.order('createdAt', { ascending: true });
            break;
          case 'title':
            imageQuery = imageQuery.order('content', { ascending: true });
            break;
          case 'status':
            imageQuery = imageQuery.order('status', { ascending: true });
            break;
        }

        const { data: images, error: imageError } = await imageQuery
          .range(offset, offset + limit - 1);

        if (imageError) {
          console.error('Image fetch error:', imageError);
        } else {
          allContent.push(...(images || []).map(image => ({
            ...image,
            type: 'image' as const,
            title: image.content?.substring(0, 50) + (image.content && image.content.length > 50 ? '...' : '') || 'Image Post',
            thumbnail: image.imageKey ? `/api/s3/get-url?key=${encodeURIComponent(image.imageKey)}` : null
          })));
        }
      }

      // Fetch text posts
      if (types.includes('text')) {
        let textQuery = supabaseAdmin
          .from('text_posts')
          .select(`
            id,
            content,
            status,
            platforms,
            createdAt,
            updatedAt,
            scheduledFor,
            metadata,
            userId,
            teamId
          `)
          .eq('teamId', teamId);

        if (status !== 'ALL') {
          textQuery = textQuery.eq('status', status);
        }

        // Apply sorting
        switch (sortBy) {
          case 'newest':
            textQuery = textQuery.order('createdAt', { ascending: false });
            break;
          case 'oldest':
            textQuery = textQuery.order('createdAt', { ascending: true });
            break;
          case 'title':
            textQuery = textQuery.order('content', { ascending: true });
            break;
          case 'status':
            textQuery = textQuery.order('status', { ascending: true });
            break;
        }

        const { data: texts, error: textError } = await textQuery
          .range(offset, offset + limit - 1);

        if (textError) {
          console.error('Text fetch error:', textError);
        } else {
          allContent.push(...(texts || []).map(text => ({
            ...text,
            type: 'text' as const,
            title: text.content?.substring(0, 50) + (text.content && text.content.length > 50 ? '...' : '') || 'Text Post'
          })));
        }
      }

      // Fetch reel posts
      if (types.includes('reel')) {
        let reelQuery = supabaseAdmin
          .from('reel_posts')
          .select(`
            id,
            title,
            content,
            status,
            platforms,
            createdAt,
            updatedAt,
            scheduledFor,
            videoKey,
            metadata,
            userId,
            teamId
          `)
          .eq('teamId', teamId);

        if (status !== 'ALL') {
          reelQuery = reelQuery.eq('status', status);
        }

        // Apply sorting
        switch (sortBy) {
          case 'newest':
            reelQuery = reelQuery.order('createdAt', { ascending: false });
            break;
          case 'oldest':
            reelQuery = reelQuery.order('createdAt', { ascending: true });
            break;
          case 'title':
            reelQuery = reelQuery.order('title', { ascending: true });
            break;
          case 'status':
            reelQuery = reelQuery.order('status', { ascending: true });
            break;
        }

        const { data: reels, error: reelError } = await reelQuery
          .range(offset, offset + limit - 1);

        if (reelError) {
          console.error('Reel fetch error:', reelError);
        } else {
          allContent.push(...(reels || []).map(reel => ({
            ...reel,
            type: 'reel' as const,
            thumbnail: reel.videoKey ? `/api/s3/get-url?key=${encodeURIComponent(reel.videoKey)}` : null
          })));
        }
      }

      // Sort combined results if needed
      if (sortBy === 'newest') {
        allContent.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (sortBy === 'oldest') {
        allContent.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else if (sortBy === 'title') {
        allContent.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      } else if (sortBy === 'status') {
        allContent.sort((a, b) => a.status.localeCompare(b.status));
      }

      // Get user info for uploaders (avoid Set iteration for older targets)
      const userIds = Object.keys(
        allContent.reduce((acc: Record<string, true>, item: any) => {
          if (item.userId) acc[item.userId] = true;
          return acc;
        }, {})
      );
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, name, email, image')
        .in('id', userIds);

      const userMap = new Map(users?.map(user => [user.id, user]) || []);

      // Add uploader info to content
      const contentWithUsers = allContent.map(item => ({
        ...item,
        uploader: userMap.get(item.userId)
      }));

      return NextResponse.json(
        createSuccessResponse({
          content: contentWithUsers,
          total: allContent.length,
          hasMore: allContent.length === limit
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
