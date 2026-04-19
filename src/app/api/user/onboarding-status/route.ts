import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

async function getClerkUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    return userId ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const clerkUserId = await getClerkUserId();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('onboarding_completed, onboarding_skipped, onboarding_seen_at')
    .eq('clerk_id', clerkUserId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: "Failed to fetch onboarding status" }, { status: 500 });
  }

  const onboardingCompleted = Boolean(user?.onboarding_completed);
  const onboardingSkipped   = Boolean(user?.onboarding_skipped);

  return NextResponse.json({
    onboardingCompleted,
    onboardingSkipped,
    onboardingSeenAt: user?.onboarding_seen_at ?? null,
    shouldShowOnboarding: !onboardingCompleted && !onboardingSkipped,
  });
}

export async function POST(req: NextRequest) {
  const clerkUserId = await getClerkUserId();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body?.action as "seen" | "complete" | "skip" | undefined;

  if (!action) {
    return NextResponse.json({ error: "Provide { action }" }, { status: 400 });
  }

  const now = new Date().toISOString();

  // Core update — only columns that are guaranteed to exist
  const coreUpdate: Record<string, any> = { updated_at: now };

  if (action === "seen") {
    coreUpdate.onboarding_seen_at = now;
  } else if (action === "skip") {
    coreUpdate.onboarding_seen_at  = now;
    coreUpdate.onboarding_skipped  = true;
    coreUpdate.onboarding_completed = false;
  } else if (action === "complete") {
    coreUpdate.onboarding_seen_at  = now;
    coreUpdate.onboarding_completed = true;
    coreUpdate.onboarding_skipped  = false;
  }

  const { data: updatedUser, error: coreError } = await supabaseAdmin
    .from("users")
    .update(coreUpdate)
    .eq("clerk_id", clerkUserId)
    .select("onboarding_completed, onboarding_skipped, onboarding_seen_at")
    .maybeSingle();

  if (coreError) {
    console.error("Onboarding core update failed:", coreError);
    return NextResponse.json({ error: "Failed to update onboarding status" }, { status: 500 });
  }

  // Best-effort: save preference data collected during the onboarding steps.
  // Silently skipped if the columns haven't been added to the schema yet.
  if (action === "complete" && (body.role || body.goal || body.teamSize)) {
    const prefUpdate: Record<string, string> = {};
    if (body.role)     prefUpdate.onboarding_role      = String(body.role);
    if (body.goal)     prefUpdate.onboarding_goal      = String(body.goal);
    if (body.teamSize) prefUpdate.onboarding_team_size = String(body.teamSize);

    await supabaseAdmin
      .from("users")
      .update(prefUpdate)
      .eq("clerk_id", clerkUserId)
      .then(() => {})
      .catch(() => {}); // ignore — columns may not exist yet
  }

  const onboardingCompleted = Boolean(updatedUser?.onboarding_completed);
  const onboardingSkipped   = Boolean(updatedUser?.onboarding_skipped);

  return NextResponse.json({
    success: true,
    onboardingCompleted,
    onboardingSkipped,
    onboardingSeenAt: updatedUser?.onboarding_seen_at ?? null,
    shouldShowOnboarding: !onboardingCompleted && !onboardingSkipped,
  });
}
