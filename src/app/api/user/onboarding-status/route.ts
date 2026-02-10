import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserSafe } from "@/lib/clerk-supabase-utils";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { clerkUserId } = await getAuthenticatedUserSafe();
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('onboardingCompleted, onboardingSkipped, onboardingSeenAt')
      .eq('clerkId', clerkUserId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: "Failed to fetch onboarding status" }, { status: 500 });
    }

    const onboardingCompleted = Boolean(user?.onboardingCompleted);
    const onboardingSkipped = Boolean(user?.onboardingSkipped);
    const onboardingSeenAt = user?.onboardingSeenAt ?? null;
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
    let update: Record<string, any> = { updatedAt: now };

    if (action === "seen") {
      update.onboardingSeenAt = now;
    } else if (action === "skip") {
      update.onboardingSeenAt = now;
      update.onboardingSkipped = true;
      update.onboardingCompleted = false;
    } else if (action === "complete") {
      update.onboardingSeenAt = now;
      update.onboardingCompleted = true;
      update.onboardingSkipped = false;
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from("users")
      .update(update)
      .eq("clerkId", clerkUserId)
      .select("onboardingCompleted, onboardingSkipped, onboardingSeenAt")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update onboarding status" },
        { status: 500 }
      );
    }

    const onboardingCompleted = Boolean(updatedUser?.onboardingCompleted);
    const onboardingSkipped = Boolean(updatedUser?.onboardingSkipped);
    const onboardingSeenAt = updatedUser?.onboardingSeenAt ?? null;

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
