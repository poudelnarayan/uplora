export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";
import { broadcast } from "@/lib/realtime";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required"),
        { status: 401 }
      );
    }

    // Get user details from Clerk
    const userInfo = await currentUser();
    if (!userInfo) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required"),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      type, // 'image', 'text', 'reel', 'video'
      title,
      content,
      teamId,
      platforms,
      scheduledFor,
      imageUrl,
      imageKey,
      videoUrl,
      videoKey,
      thumbnailKey,
      metadata = {}
    } = body;

    // Validation
    if (!type || !['image', 'text', 'reel', 'video'].includes(type)) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Valid post type is required"),
        { status: 400 }
      );
    }

    // Title is required only for reel and video posts
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
        clerkId: userId,
        email: userInfo.emailAddresses?.[0]?.emailAddress || "",
        name: userInfo.fullName || userInfo.firstName || "",
        image: userInfo.imageUrl || "",
        updatedAt: new Date().toISOString()
      }, {
        onConflict: 'clerkId'
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

    // Check if user has access to this team
    const isOwner = team.ownerId === user.id;
    let hasAccess = isOwner;

    if (!isOwner) {
      const { data: membership } = await supabaseAdmin
        .from('team_members')
        .select('role, status')
        .eq('teamId', teamId)
        .eq('userId', user.id)
        .eq('status', 'ACTIVE')
        .single();

      hasAccess = !!membership;
    }

    if (!hasAccess) {
      return NextResponse.json(
        createErrorResponse(ErrorCodes.FORBIDDEN, "You don't have access to this team"),
        { status: 403 }
      );
    }

    // Create the post
    const postId = `post-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    // Determine the S3 folder structure for media files
    let folderPath = null;
    if (type === 'image') {
      folderPath = `teams/${teamId}/images/`;
    } else if (type === 'reel') {
      folderPath = `teams/${teamId}/reels/`;
    } else if (type === 'video') {
      folderPath = `teams/${teamId}/videos/`;
    }
    // Text posts don't need folderPath as they're stored in Supabase only

    // Create post in the appropriate table based on type
    let post, createError;

    if (type === 'text') {
      // Text posts table
      const { data: textPost, error: textError } = await supabaseAdmin
        .from('text_posts')
        .insert({
          id: postId,
          content: content?.trim() || "",
          teamId: teamId,
          userId: user.id,
          platforms: platforms || [],
          scheduledFor: scheduledFor || null,
          status: scheduledFor ? 'SCHEDULED' : 'DRAFT',
          metadata: metadata,
          createdAt: now,
          updatedAt: now
        })
        .select()
        .single();
      
      post = textPost;
      createError = textError;
      
    } else if (type === 'image') {
      // Image posts table
      const { data: imagePost, error: imageError } = await supabaseAdmin
        .from('image_posts')
        .insert({
          id: postId,
          content: content?.trim() || "",
          teamId: teamId,
          userId: user.id,
          platforms: platforms || [],
          scheduledFor: scheduledFor || null,
          status: scheduledFor ? 'SCHEDULED' : 'DRAFT',
          folderPath: folderPath,
          imageUrl: imageUrl || null,
          imageKey: imageKey || null,
          metadata: metadata,
          createdAt: now,
          updatedAt: now
        })
        .select()
        .single();
      
      post = imagePost;
      createError = imageError;
      
    } else if (type === 'reel') {
      // Reels table
      const { data: reelPost, error: reelError } = await supabaseAdmin
        .from('reel_posts')
        .insert({
          id: postId,
          title: title.trim(),
          content: content?.trim() || "",
          teamId: teamId,
          userId: user.id,
          platforms: platforms || [],
          scheduledFor: scheduledFor || null,
          status: scheduledFor ? 'SCHEDULED' : 'DRAFT',
          folderPath: folderPath,
          videoUrl: videoUrl || null,
          videoKey: videoKey || null,
          thumbnailKey: thumbnailKey || null,
          metadata: metadata,
          createdAt: now,
          updatedAt: now
        })
        .select()
        .single();
      
      post = reelPost;
      createError = reelError;
      
    } else {
      // For video type, redirect to existing video upload system
      return NextResponse.json(
        createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Use /make-post/video for video uploads"),
        { status: 400 }
      );
    }

    if (createError) {
      console.error("Post creation error:", createError);
      return NextResponse.json(
        createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create post"),
        { status: 500 }
      );
    }

    // Broadcast the post creation
    const broadcastPayload: any = { 
      id: post.id, 
      type: post.type,
      teamId: post.teamId
    };

    // Only include title for reel and video posts
    if ((type === 'reel' || type === 'video') && post.title) {
      broadcastPayload.title = post.title;
    }
    
    // Only include folderPath for non-text posts (media files)
    if (type !== 'text' && post.folderPath) {
      broadcastPayload.folderPath = post.folderPath;
    }

    broadcast({
      type: "post.created",
      payload: broadcastPayload,
    });

    const responseData: any = {
      id: post.id,
      type: type,
      content: post.content,
      teamId: post.teamId,
      platforms: post.platforms,
      status: post.status,
      createdAt: post.createdAt
    };

    // Only include folderPath for non-text posts (media files)
    if (type !== 'text' && post.folderPath) {
      responseData.folderPath = post.folderPath;
    }

    // Only include title for reel and video posts
    if ((type === 'reel' || type === 'video') && post.title) {
      responseData.title = post.title;
    }

    return NextResponse.json(createSuccessResponse({
      data: responseData
    }));

  } catch (error) {
    console.error("Post creation error:", error);
    return NextResponse.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create post"),
      { status: 500 }
    );
  }
}
