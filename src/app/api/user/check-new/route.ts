import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId: requestedUserId } = body;

    // Ensure user can only check their own status
    if (userId !== requestedUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if user exists in our database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, createdAt')
      .eq('clerkId', userId)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking user:', userError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // If user doesn't exist in our database, they're new
    if (!user) {
      return NextResponse.json({ isNew: true });
    }

    // Check if user has any content
    const { data: content, error: contentError } = await supabaseAdmin
      .from('text_posts')
      .select('id')
      .eq('userId', user.id)
      .limit(1);

    if (contentError) {
      console.error('Error checking content:', contentError);
    }

    // Check if user has any teams (other than personal)
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from('teams')
      .select('id')
      .eq('ownerId', user.id)
      .neq('isPersonal', true)
      .limit(1);

    if (teamsError) {
      console.error('Error checking teams:', teamsError);
    }

    // Check if user has any videos
    const { data: videos, error: videosError } = await supabaseAdmin
      .from('video_posts')
      .select('id')
      .eq('userId', user.id)
      .limit(1);

    if (videosError) {
      console.error('Error checking videos:', videosError);
    }

    // Check if user has any images
    const { data: images, error: imagesError } = await supabaseAdmin
      .from('image_posts')
      .select('id')
      .eq('userId', user.id)
      .limit(1);

    if (imagesError) {
      console.error('Error checking images:', imagesError);
    }

    // Check if user has any reels
    const { data: reels, error: reelsError } = await supabaseAdmin
      .from('reel_posts')
      .select('id')
      .eq('userId', user.id)
      .limit(1);

    if (reelsError) {
      console.error('Error checking reels:', reelsError);
    }

    // User is considered new if they have no content, teams, videos, images, or reels
    const hasContent = content && content.length > 0;
    const hasTeams = teams && teams.length > 0;
    const hasVideos = videos && videos.length > 0;
    const hasImages = images && images.length > 0;
    const hasReels = reels && reels.length > 0;

    const isNew = !hasContent && !hasTeams && !hasVideos && !hasImages && !hasReels;

    return NextResponse.json({ isNew });

  } catch (error) {
    console.error('Error in check-new API:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
