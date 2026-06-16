export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";
import { broadcast } from "@/lib/realtime";
import { mapToDbStatus } from "@/lib/postStatus";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required"),
        { status: 401 }
      );
    }

    const userInfo = await currentUser();
    if (!userInfo) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required"),
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      type,
      title,
      content,
      teamId,
      platforms,
      scheduledFor,
      imageKey,
      videoKey,
      thumbnailKey,
      metadata = {}
    } = body;

    if (!type || !['image', 'text', 'reel', 'video'].includes(type)) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Valid post type is required"),
        { status: 400 }
      );
    }

    if ((type === 'reel' || type === 'video') && (!title || typeof title !== 'string' || title.trim().length === 0)) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Post title is required"),
        { status: 400 }
      );
    }

    if (!teamId) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Team ID is required"),
        { status: 400 }
      );
    }

    // Ensure user exists in database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        clerk_id: userId,
        email: userInfo.emailAddresses?.[0]?.emailAddress || "",
        name: userInfo.fullName || userInfo.firstName || "",
        image: userInfo.imageUrl || "",
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'clerk_id'
      })
      .select()
      .single();

    if (userError) {
      console.error("User sync error:", userError);
      return NextResponse.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to sync user"),
        { status: 500 }
      );
    }

    // Verify team access
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.NOT_FOUND, "Team not found"),
        { status: 404 }
      );
    }

    const isOwner = team.owner_id === user.id;
    let hasAccess = isOwner;
    let membershipRole: string | null = null;

    if (!isOwner) {
      const { data: membership } = await supabaseAdmin
        .from('team_members')
        .select('role, status')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .single();

      hasAccess = !!membership;
      membershipRole = (membership as any)?.role || null;
    }

    if (!hasAccess) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "You don't have access to this team"),
        { status: 403 }
      );
    }

    const role = isOwner ? "OWNER" : (membershipRole || "MEMBER");
    const canAutoSchedule = ["OWNER", "ADMIN", "MANAGER"].includes(role);
    const scheduledForValue = canAutoSchedule ? (scheduledFor || null) : null;
    const initialStatus = scheduledForValue ? "scheduled" : "draft";

    let folderPath: string | null = null;
    if (type === 'image') folderPath = `teams/${teamId}/images/`;
    else if (type === 'reel') folderPath = `teams/${teamId}/reels/`;
    else if (type === 'video') folderPath = `teams/${teamId}/videos/`;

    const postId = `post-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    // Build metadata
    const postMetadata: any = {
      ...metadata,
      platforms: platforms || [],
    };
    if (type === 'reel' && title) postMetadata.title = title.trim();
    if (type === 'video' && title) postMetadata.title = title.trim();

    // Insert unified post
    const { data: post, error: createError } = await supabaseAdmin
      .from('posts')
      .insert({
        id: postId,
        post_type: type,
        content: content?.trim() || "",
        team_id: teamId,
        author_id: user.id,
        status: initialStatus,
        scheduled_for: scheduledForValue,
        folder_path: folderPath,
        metadata: postMetadata,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (createError) {
      console.error("Post creation error:", createError);
      return NextResponse.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create post"),
        { status: 500 }
      );
    }

    // Insert media into post_media table
    const mediaInserts: any[] = [];

    if (type === 'image' && imageKey) {
      mediaInserts.push({
        post_id: postId,
        media_type: 'image',
        s3_key: imageKey,
        position: 0,
        created_at: now,
      });
    } else if (type === 'reel' && videoKey) {
      mediaInserts.push({
        post_id: postId,
        media_type: 'video',
        s3_key: videoKey,
        position: 0,
        created_at: now,
      });
      if (thumbnailKey) {
        mediaInserts.push({
          post_id: postId,
          media_type: 'thumbnail',
          s3_key: thumbnailKey,
          position: 0,
          created_at: now,
        });
      }
    }

    if (mediaInserts.length > 0) {
      await supabaseAdmin.from('post_media').insert(mediaInserts);
    }

    broadcast({
      type: "post.created",
      payload: {
        id: post.id,
        type: post.post_type,
        teamId: post.team_id,
        ...(folderPath ? { folderPath } : {}),
        ...(title ? { title } : {}),
      },
    });

    return NextResponse.json(createSuccessResponse({
      data: {
        id: post.id,
        type: post.post_type,
        content: post.content,
        teamId: post.team_id,
        platforms: post.metadata?.platforms || [],
        status: post.status,
        createdAt: post.created_at,
        ...(folderPath ? { folderPath } : {}),
        ...(title ? { title } : {}),
      }
    }));

  } catch (error) {
    console.error("Post creation error:", error);
    return NextResponse.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create post"),
      { status: 500 }
    );
  }
}
