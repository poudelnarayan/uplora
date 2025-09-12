export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withAuth, checkTeamAccess, ensurePersonalTeam, formatVideoResponse } from "@/lib/clerk-supabase-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { createErrorResponse, ErrorCodes } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const result = await withAuth(async ({ supabaseUser }) => {
      const { searchParams } = new URL(req.url);
      const scope = searchParams.get('scope');
      let teamId = searchParams.get('teamId');

      if (scope === 'all') {
        // Gather all teams the user has access to (owner or member), including personal
        const personalTeamId = await ensurePersonalTeam(supabaseUser.id);

        const ownerTeamsPromise = supabaseAdmin
          .from('teams')
          .select('id')
          .eq('ownerId', supabaseUser.id);

        const memberTeamsPromise = supabaseAdmin
          .from('team_members')
          .select('teamId')
          .eq('userId', supabaseUser.id);

        const [ownerTeamsRes, memberTeamsRes] = await Promise.all([ownerTeamsPromise, memberTeamsPromise]);

        const ownerTeamIds = (ownerTeamsRes.data || []).map((t: any) => t.id);
        const memberTeamIds = (memberTeamsRes.data || []).map((m: any) => m.teamId);
        const allTeamIds: string[] = Array.from(new Set([personalTeamId, ...ownerTeamIds, ...memberTeamIds].filter(Boolean)));

        if (allTeamIds.length === 0) {
          return [] as any;
        }

        const { data: videos, error } = await supabaseAdmin
          .from('video_posts')
          .select(`
            *,
            users:users!videos_userId_fkey (
              id,
              name,
              email,
              image
            )
          `)
          .in('teamId', allTeamIds)
          .order('updatedAt', { ascending: false })
          .limit(200);

        if (error) {
          console.error("Supabase error:", error);
          return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch videos");
        }

        const formattedVideos = (videos || []).map((video: any) => ({
          ...formatVideoResponse(video),
          uploader: {
            id: video.users?.id,
            name: video.users?.name,
            email: video.users?.email,
            image: video.users?.image
          }
        }));

        return formattedVideos as any;
      }

      // Default: single team (explicit or personal)
      if (!teamId) {
        teamId = await ensurePersonalTeam(supabaseUser.id);
      }

      const access = await checkTeamAccess(teamId!, supabaseUser.id);
      if (!access.hasAccess) {
        return createErrorResponse(ErrorCodes.FORBIDDEN, "Not a member of this team");
      }

      const { data: videos, error } = await supabaseAdmin
        .from('video_posts')
        .select(`
          *,
          users:users!videos_userId_fkey (
            id,
            name,
            email,
            image
          )
        `)
        .eq('teamId', teamId)
        .order('updatedAt', { ascending: false })
        .limit(50);

      if (error) {
        console.error("Supabase error:", error);
        return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch videos");
      }

      const formattedVideos = (videos || []).map((video: any) => ({
        ...formatVideoResponse(video),
        uploader: {
          id: video.users?.id,
          name: video.users?.name,
          email: video.users?.email,
          image: video.users?.image
        }
      }));

      return formattedVideos as any;
    });

    if ((result as any)?.ok === false) {
      return NextResponse.json(result, { status: 401 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Videos API error", error);
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

      if (!key || !filename || !contentType || !sizeBytes) {
        return createErrorResponse(
          ErrorCodes.VALIDATION_ERROR, 
          "Missing required fields: key, filename, contentType, sizeBytes"
        );
      }

      const resolvedTeamId = teamId || await ensurePersonalTeam(supabaseUser.id);
      const access = await checkTeamAccess(resolvedTeamId, supabaseUser.id);
      if (!access.hasAccess) {
        return createErrorResponse(ErrorCodes.FORBIDDEN, "Not a member of this team");
      }

      const { data: video, error } = await supabaseAdmin
        .from('video_posts')
        .insert({
          key,
          filename,
          contentType: contentType,
          sizeBytes: sizeBytes,
          userId: supabaseUser.id,
          teamId: resolvedTeamId,
          description: description || null,
          visibility: visibility || null,
          madeForKids: madeForKids || false,
          status: 'PROCESSING',
          updatedAt: new Date().toISOString(),
        })
        .select(`
          *,
          users:users!videos_userId_fkey (
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
          id: video.users?.id,
          name: video.users?.name,
          email: video.users?.email,
          image: video.users?.image
        }
      };

      return formattedVideo as any;
    });

    if ((result as any)?.ok === false) {
      return NextResponse.json(result, { status: 401 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Video creation error:", error);
    return NextResponse.json({ error: "Failed to create video" }, { status: 500 });
  }
}
