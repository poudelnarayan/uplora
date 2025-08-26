export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withAuth, checkTeamAccess, formatVideoResponse } from "@/lib/clerk-supabase-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { createErrorResponse, createSuccessResponse, ErrorCodes } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const result = await withAuth(async ({ supabaseUser }) => {
      // Get teamId from query params
      const { searchParams } = new URL(req.url);
      const teamId = searchParams.get('teamId');

      let whereClause: any = {};

      if (teamId) {
        // Check if user has access to this team
        const access = await checkTeamAccess(teamId, supabaseUser.id);
        
        if (!access.hasAccess) {
          return createErrorResponse(ErrorCodes.FORBIDDEN, "Not a member of this team");
        }
        
        // Show all videos that belong to this team
        whereClause = { teamId: teamId };
      } else {
        // Show videos that belong to the user and have no team (legacy behavior)
        whereClause = { userId: supabaseUser.id, teamId: null };
      }

      // Get videos with user information
      const { data: videos, error } = await supabaseAdmin
        .from('videos')
        .select(`
          *,
          users (
            id,
            name,
            email,
            image
          )
        `)
        .match(whereClause)
        .order('uploadedAt', { ascending: false })
        .limit(50);

      if (error) {
        console.error("Supabase error:", error);
        return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch videos");
      }

      const formattedVideos = videos.map(video => ({
        ...formatVideoResponse(video),
        uploader: {
          id: video.users.id,
          name: video.users.name,
          email: video.users.email,
          image: video.users.image
        }
      }));

      return createSuccessResponse(formattedVideos);
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 401 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Videos API error:", error);
    return NextResponse.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch videos"),
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const result = await withAuth(async ({ supabaseUser }) => {
      const body = await req.json();
      const { 
        key, 
        filename, 
        contentType, 
        sizeBytes, 
        teamId,
        description,
        visibility,
        madeForKids 
      } = body;

      // Basic validation
      if (!key || !filename || !contentType || !sizeBytes) {
        return createErrorResponse(
          ErrorCodes.VALIDATION_ERROR, 
          "Missing required fields: key, filename, contentType, sizeBytes"
        );
      }

      // If teamId is provided, verify access
      if (teamId) {
        const access = await checkTeamAccess(teamId, supabaseUser.id);
        if (!access.hasAccess) {
          return createErrorResponse(ErrorCodes.FORBIDDEN, "Not a member of this team");
        }
      }

      // Create video record
      const { data: video, error } = await supabaseAdmin
        .from('videos')
        .insert({
          key,
          filename,
          contentType: contentType,
          sizeBytes: sizeBytes,
          userId: supabaseUser.id,
          teamId: teamId || null,
          description: description || null,
          visibility: visibility || null,
          madeForKids: madeForKids || false,
          status: 'PROCESSING'
        })
        .select(`
          *,
          users (
            id,
            name,
            email,
            image
          )
        `)
        .single();

      if (error) {
        console.error("Supabase error:", error);
        return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create video");
      }

      const formattedVideo = {
        ...formatVideoResponse(video),
        uploader: {
          id: video.users.id,
          name: video.users.name,
          email: video.users.email,
          image: video.users.image
        }
      };

      return createSuccessResponse(formattedVideo);
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 401 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Video creation error:", error);
    return NextResponse.json(
      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create video"),
      { status: 500 }
    );
  }
}
