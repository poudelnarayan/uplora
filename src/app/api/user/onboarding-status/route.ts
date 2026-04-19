import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserSafe } from "@/lib/clerk-supabase-utils";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { clerkUserId } = await getAuthenticatedUserSafe();
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('onboarding_completed, onboarding_skipped, onboarding_seen_at')
      .eq('clerk_id', clerkUserId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: "Failed to fetch onboarding status" }, { status: 500 });
    }

    const onboardingCompleted = Boolean(user?.onboarding_completed);
    const onboardingSkipped = Boolean(user?.onboarding_skipped);
    const onboardingSeenAt = user?.onboarding_seen_at ?? null;
    const shouldShowOnboarding = !onboardingCompleted && !onboardingSkipped;

    return NextResponse.json({
      onboardingCompleted,
      onboardingSkipped,
      onboardingSeenAt,
      shouldShowOnboarding
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { clerkUserId } = await getAuthenticatedUserSafe();
    const body = await req.json().catch(() => ({}));
    const action = body?.action as "seen" | "complete" | "skip" | undefined;

    if (!action) {
      return NextResponse.json(
        { error: "Invalid request body. Provide { action }." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    let update: Record<string, any> = { updated_at: now };

    if (action === "seen") {
      update.onboarding_seen_at = now;
    } else if (action === "skip") {
      update.onboarding_seen_at = now;
      update.onboarding_skipped = true;
      update.onboarding_completed = false;
    } else if (action === "complete") {
      update.onboarding_seen_at = now;
      update.onboarding_completed = true;
      update.onboarding_skipped = false;
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from("users")
      .update(update)
      .eq("clerk_id", clerkUserId)
      .select("onboarding_completed, onboarding_skipped, onboarding_seen_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update onboarding status" },
        { status: 500 }
      );
    }

    const onboardingCompleted = Boolean(updatedUser?.onboarding_completed);
    const onboardingSkipped = Boolean(updatedUser?.onboarding_skipped);
    const onboardingSeenAt = updatedUser?.onboarding_seen_at ?? null;

    return NextResponse.json({
      success: true,
      onboardingCompleted,
      onboardingSkipped,
      onboardingSeenAt,
      shouldShowOnboarding: !onboardingCompleted && !onboardingSkipped
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
