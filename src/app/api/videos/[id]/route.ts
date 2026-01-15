export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcast } from "@/lib/realtime";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Auth required" }, { status: 401 });
    const { id } = context.params;

    // Get user details from Clerk and sync with Supabase
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    const userName = clerkUser.fullName || clerkUser.firstName || "";
    const userImage = clerkUser.imageUrl || "";

    // Ensure user exists in Supabase
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        clerkId: userId,
        email: userEmail || "", 
        name: userName, 
        image: userImage,
        updatedAt: new Date().toISOString()
      }, {
        onConflict: 'clerkId'
      })
      .select()
      .single();

    if (userError) {
      console.error("User sync error:", userError);
      return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
    }

    const { data: v, error: videoError } = await supabaseAdmin
      .from('video_posts')
      .select(`
        *,
        users!videos_userId_fkey (
          id,
          name,
          email,
          image
        )
      `)
      .eq('id', id)
      .single();

    if (videoError || !v) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Check access: owner or team member/owner if team video
    let hasAccess = v.userId === user.id; // Video uploader access
    if (!hasAccess && v.teamId) {
      // If team video, allow team owner or any member
      const { data: team, error: teamError } = await supabaseAdmin
        .from('teams')
        .select('*')
        .eq('id', v.teamId)
        .single();

      if (team && team.ownerId === user.id) {
        hasAccess = true;
      } else {
        const { data: membership, error: membershipError } = await supabaseAdmin
          .from('team_members')
          .select('*')
          .eq('teamId', v.teamId)
          .eq('userId', user.id)
          .single();
        hasAccess = !!membership;
      }
    }
    
    if (!hasAccess) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    return NextResponse.json({
      id: v.id,
      key: v.key,
      filename: v.filename,
      contentType: v.contentType,
      status: v.status || "PROCESSING",
      uploadedAt: v.uploadedAt,
      updatedAt: v.updatedAt,
      teamId: v.teamId || undefined,
      requestedByUserId: v.requestedByUserId || null,
      approvedByUserId: v.approvedByUserId || null,
      // Include metadata fields
      description: v.description || "",
      visibility: v.visibility || "public",
      madeForKids: v.madeForKids || false,
      thumbnailKey: v.thumbnailKey || null,
      // YouTube fields
      youtubeVideoId: (v as any).youtubeVideoId || null,
      youtubeThumbnailUploadStatus: (v as any).youtubeThumbnailUploadStatus || null,
      youtubeThumbnailUploadError: (v as any).youtubeThumbnailUploadError || null,
      uploader: {
        id: v.users.id,
        name: v.users.name,
        email: v.users.email,
        image: v.users.image
      }
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

    // Get user details from Clerk and sync with Supabase
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    const userName = clerkUser.fullName || clerkUser.firstName || "";
    const userImage = clerkUser.imageUrl || "";

    // Ensure user exists in Supabase
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        clerkId: userId,
        email: userEmail || "", 
        name: userName, 
        image: userImage,
        updatedAt: new Date().toISOString()
      }, {
        onConflict: 'clerkId'
      })
      .select()
      .single();

    if (userError) {
      console.error("User sync error:", userError);
      return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
    }

    // Check access: owner or team member (team owner included)
    const { data: video, error: videoError } = await supabaseAdmin
      .from('video_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    let hasAccess = video.userId === user.id; // Uploader (personal owner)
    let team: { ownerId: string } | null = null;
    if (!hasAccess && video.teamId) {
      // Team owner has access
      const { data: teamData, error: teamError } = await supabaseAdmin
        .from('teams')
        .select('ownerId')
        .eq('id', video.teamId)
        .single();

      if (teamData?.ownerId === user.id) {
        hasAccess = true;
        team = teamData;
      } else {
        // Check if user is a member of the video's team
        const { data: membership, error: membershipError } = await supabaseAdmin
          .from('team_members')
          .select('*')
          .eq('teamId', video.teamId)
          .eq('userId', user.id)
          .single();
        hasAccess = !!membership;
      }
    }
    
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // If video is awaiting approval/publish, lock edits for non-owners (uploader for personal, team owner for team videos)
    if (String(video.status || "").toUpperCase() === 'PENDING' || String(video.status || "").toUpperCase() === 'APPROVED') {
      let isOwner = video.userId === user.id;
      if (video.teamId && !isOwner) {
        // use previously fetched team when available
        if (!team) {
          const { data: teamData, error: teamError } = await supabaseAdmin
            .from('teams')
            .select('ownerId')
            .eq('id', video.teamId)
            .single();
          team = teamData;
        }
        if (team?.ownerId === user.id) isOwner = true;
      }
      if (!isOwner) {
        return NextResponse.json({ error: "Video is locked for review/publish. Only the owner can edit." }, { status: 403 });
      }
    }

    const { title, description, visibility, madeForKids, thumbnailKey, status } = body as {
      title?: string;
      description?: string;
      visibility?: string;
      madeForKids?: boolean;
      thumbnailKey?: string | null;
      status?: string;
    };

    // Optional: owner-only status revert from PENDING -> PROCESSING
    let statusData: { status?: any; requestedByUserId?: string | null; approvedByUserId?: string | null } = {};
    if (typeof status === 'string') {
      // Determine if current user is the owner of this video/team
      let isOwnerOfVideo = video.userId === user.id;
      if (!isOwnerOfVideo && video.teamId) {
        const { data: teamData, error: teamError } = await supabaseAdmin
          .from('teams')
          .select('*')
          .eq('id', video.teamId)
          .single();
        if (teamData?.ownerId === user.id) isOwnerOfVideo = true;
      }
      // Allow only reverting to PROCESSING by owner
      if (isOwnerOfVideo && status.toUpperCase() === 'PROCESSING') {
        statusData = { status: 'PROCESSING', requestedByUserId: null, approvedByUserId: null };
      }
    }

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (typeof title === 'string' && title.length) updateData.filename = title;
    if (typeof description === 'string') updateData.description = description;
    if (typeof visibility === 'string') updateData.visibility = visibility;
    if (typeof madeForKids === 'boolean') updateData.madeForKids = madeForKids;
    if (typeof thumbnailKey === 'string' || thumbnailKey === null) updateData.thumbnailKey = thumbnailKey;
    if (statusData.status) updateData.status = statusData.status;
    if (statusData.requestedByUserId !== undefined) updateData.requestedByUserId = statusData.requestedByUserId;
    if (statusData.approvedByUserId !== undefined) updateData.approvedByUserId = statusData.approvedByUserId;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('video_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating video:", updateError);
      return NextResponse.json({ error: "Failed to update video" }, { status: 500 });
    }

    // Broadcast updates with status information
    if (statusData.status) {
      // Status change event
      broadcast({ 
        type: "video.status", 
        teamId: updated.teamId || null, 
        payload: { id: updated.id, status: statusData.status }
      });
    } else {
      // General update event
      broadcast({ 
        type: "video.updated", 
        teamId: updated.teamId || null, 
        payload: { id: updated.id }
      });
    }

    return NextResponse.json({ ok: true, video: updated });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update video" }, { status: 500 });
  }
}
