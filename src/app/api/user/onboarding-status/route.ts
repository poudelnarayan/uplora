import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserSafe } from "@/lib/clerk-supabase-utils";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { clerkUserId, supabaseUser } = await getAuthenticatedUserSafe();
    const userId = clerkUserId;

    // Get user's onboarding status from database - using correct column name
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, createdAt, onboardingCompleted, onboardingSkipped, onboardingSeenAt') // camelCase column names
      .eq('clerkId', userId)
      .single();

    if (error) {
      console.error("❌ Error fetching onboarding status:", error);
      // If user doesn't exist, they haven't completed onboarding
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          onboardingCompleted: false,
          onboardingSkipped: false,
          onboardingSeenAt: null,
          shouldShowOnboarding: true
        });
      }
      return NextResponse.json({ error: "Failed to fetch onboarding status" }, { status: 500 });
    }

    const onboardingCompleted = user?.onboardingCompleted || false;
    const onboardingSkipped = user?.onboardingSkipped || false;
    const onboardingSeenAt = user?.onboardingSeenAt || null;

    // Only auto-show onboarding for truly new users:
    // - Not completed
    // - Not skipped
    // - Never seen
    // - AND they haven't created any content/teams yet
    const internalUserId = user?.id ?? supabaseUser?.id;

    let hasAnyContent = false;
    if (internalUserId) {
      const [content, teams, videos, images, reels] = await Promise.all([
        supabaseAdmin.from('text_posts').select('id').eq('userId', internalUserId).limit(1),
        supabaseAdmin.from('teams').select('id').eq('ownerId', internalUserId).neq('isPersonal', true).limit(1),
        supabaseAdmin.from('video_posts').select('id').eq('userId', internalUserId).limit(1),
        supabaseAdmin.from('image_posts').select('id').eq('userId', internalUserId).limit(1),
        supabaseAdmin.from('reel_posts').select('id').eq('userId', internalUserId).limit(1),
      ]);

      hasAnyContent =
        (content.data?.length ?? 0) > 0 ||
        (teams.data?.length ?? 0) > 0 ||
        (videos.data?.length ?? 0) > 0 ||
        (images.data?.length ?? 0) > 0 ||
        (reels.data?.length ?? 0) > 0;
    }

    const shouldShowOnboarding =
      !onboardingCompleted && !onboardingSkipped && !onboardingSeenAt && !hasAnyContent;

    console.log(`📊 User ${userId} onboarding status:`, onboardingCompleted);

    return NextResponse.json({ 
      onboardingCompleted,
      onboardingSkipped,
      onboardingSeenAt,
      shouldShowOnboarding
    });

  } catch (error) {
    console.error("❌ Onboarding status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { clerkUserId } = await getAuthenticatedUserSafe();
    const userId = clerkUserId;

    const body = await req.json().catch(() => ({}));
    const action = body?.action as "seen" | "complete" | "skip" | undefined;
    const onboardingCompleted = body?.onboardingCompleted as boolean | undefined;
    const onboardingSkipped = body?.onboardingSkipped as boolean | undefined;

    // Backwards compatible:
    // - { onboardingCompleted: true } => complete
    // - { action: "skip" } => skip
    // - { action: "seen" } => mark seen
    let update: Record<string, any> = { updatedAt: new Date().toISOString() };

    if (action === "seen") {
      update.onboardingSeenAt = new Date().toISOString();
    } else if (action === "skip") {
      update.onboardingSeenAt = new Date().toISOString();
      update.onboardingSkipped = true;
      update.onboardingCompleted = false;
    } else if (action === "complete") {
      update.onboardingSeenAt = new Date().toISOString();
      update.onboardingCompleted = true;
      update.onboardingSkipped = false;
    } else if (typeof onboardingCompleted === "boolean") {
      update.onboardingSeenAt = new Date().toISOString();
      update.onboardingCompleted = onboardingCompleted;
      if (onboardingCompleted) update.onboardingSkipped = false;
    } else if (typeof onboardingSkipped === "boolean") {
      update.onboardingSeenAt = new Date().toISOString();
      update.onboardingSkipped = onboardingSkipped;
      if (onboardingSkipped) update.onboardingCompleted = false;
    } else {
      return NextResponse.json(
        { error: "Invalid request body. Provide { action } or { onboardingCompleted }." },
        { status: 400 }
      );
    }

    // IMPORTANT:
    // - We must guarantee the row exists (new user) so onboarding doesn't loop.
    // - But we must NOT overwrite `users.id` if your schema uses UUIDs.
    //   So we only include `id` when the row doesn't exist yet.
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("clerkId", userId)
      .maybeSingle();

    if (existingError && existingError.code !== "PGRST116") {
      console.error("❌ Error checking existing user row:", existingError);
      return NextResponse.json({ error: "Failed to update onboarding status" }, { status: 500 });
    }

    const insertOrUpdate = existing?.id
      ? { clerkId: userId, ...update }
      : { id: userId, clerkId: userId, ...update };

    const { error } = await supabaseAdmin
      .from("users")
      .upsert(insertOrUpdate, { onConflict: "clerkId" });

    if (error) {
      console.error("❌ Error updating onboarding status:", error);
      return NextResponse.json({ error: "Failed to update onboarding status" }, { status: 500 });
    }

    console.log("✅ Successfully updated onboarding status in database");
    return NextResponse.json({ 
      success: true, 
      ...update
    });

  } catch (error) {
    console.error("❌ Update onboarding status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}