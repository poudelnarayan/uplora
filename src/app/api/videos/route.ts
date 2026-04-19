export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withAuth, checkTeamAccess, ensurePersonalTeam } from "@/lib/clerk-supabase-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { createErrorResponse, ErrorCodes } from "@/lib/api-utils";
import { postToVideoRow } from "@/lib/video-utils";

export async function GET(req: NextRequest) {
  try {
    const result = await withAuth(async ({ supabaseUser }) => {
      const { searchParams } = new URL(req.url);
      const scope = searchParams.get('scope');
      let teamId = searchParams.get('teamId');

      const videoSelect = `
        *,
        post_media (id, media_type, s3_key, filename, content_type, size_bytes, duration_ms, position),
        users!posts_author_id_fkey (id, name, email, image)
      `;

      if (scope === 'all') {
        const personalTeamId = await ensurePersonalTeam(supabaseUser.id);

        const [ownerRes, memberRes] = await Promise.all([
          supabaseAdmin.from('teams').select('id').eq('owner_id', supabaseUser.id),
          supabaseAdmin.from('team_members').select('team_id').eq('user_id', supabaseUser.id),
        ]);

        const allTeamIds: string[] = Array.from(new Set([
          personalTeamId,
          ...((ownerRes.data || []).map((t: any) => t.id)),
          ...((memberRes.data || []).map((m: any) => m.team_id)),
        ].filter(Boolean)));

        if (allTeamIds.length === 0) return [] as any;

        const { data: posts, error } = await supabaseAdmin
          .from('posts')
          .select(videoSelect)
          .eq('post_type', 'video')
          .in('team_id', allTeamIds)
          .order('updated_at', { ascending: false })
          .limit(200);

        if (error) return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch videos");

        return (posts || []).map((p: any) => {
          const v = postToVideoRow(p);
          return {
            ...v,
            uploader: p.users,
          };
        }) as any;
      }

      if (!teamId) {
        teamId = await ensurePersonalTeam(supabaseUser.id);
      }

      const access = await checkTeamAccess(teamId!, supabaseUser.id);
      if (!access.hasAccess) {
        return createErrorResponse(ErrorCodes.FORBIDDEN, "Not a member of this team");
      }

      const { data: posts, error } = await supabaseAdmin
        .from('posts')
        .select(videoSelect)
        .eq('post_type', 'video')
        .eq('team_id', teamId)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch videos");

      return (posts || []).map((p: any) => {
        const v = postToVideoRow(p);
        return { ...v, uploader: p.users };
      }) as any;
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
      const { key, filename, contentType, sizeBytes, teamId, description, visibility, madeForKids } = body;

      if (!key || !filename || !contentType || !sizeBytes) {
        return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Missing required fields: key, filename, contentType, sizeBytes");
      }

      const resolvedTeamId = teamId || await ensurePersonalTeam(supabaseUser.id);
      const access = await checkTeamAccess(resolvedTeamId, supabaseUser.id);
      if (!access.hasAccess) {
        return createErrorResponse(ErrorCodes.FORBIDDEN, "Not a member of this team");
      }

      const postId = `post-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const now = new Date().toISOString();

      const { data: post, error: postError } = await supabaseAdmin
        .from('posts')
        .insert({
          id: postId,
          post_type: 'video',
          content: description || "",
          team_id: resolvedTeamId,
          author_id: supabaseUser.id,
          status: 'draft',
          folder_path: `teams/${resolvedTeamId}/videos/`,
          metadata: {
            video_status: 'PROCESSING',
            visibility: visibility || null,
            made_for_kids: madeForKids || false,
            filename,
          },
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (postError) return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create video");

      await supabaseAdmin.from('post_media').insert({
        post_id: postId,
        media_type: 'video',
        s3_key: key,
        filename,
        content_type: contentType,
        size_bytes: sizeBytes,
        position: 0,
        created_at: now,
      });

      const { data: fullPost } = await supabaseAdmin
        .from('posts')
        .select(`*, post_media (*)`)
        .eq('id', postId)
        .single();

      const v = postToVideoRow(fullPost);
      return { ...v, uploader: { id: supabaseUser.id } } as any;
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
