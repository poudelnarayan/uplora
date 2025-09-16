import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/clerk-supabase-utils";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await safeAuth();
    if (!userId) {
      console.log("❌ No userId found in GET request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`🔍 Fetching onboarding status for user: ${userId}`);

    // Get user's onboarding status from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('onboardingcompleted')
      .eq('clerkId', userId)
      .single();

    if (error) {
      console.error("❌ Error fetching onboarding status:", error);
      return NextResponse.json({ error: "Failed to fetch onboarding status" }, { status: 500 });
    }

    const onboardingCompleted = user?.onboardingcompleted || false;
    console.log(`📊 User ${userId} onboarding status:`, onboardingCompleted);

    return NextResponse.json({ 
      onboardingCompleted 
    });

  } catch (error) {
    console.error("❌ Onboarding status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await safeAuth();
    if (!userId) {
      console.log("❌ No userId found in POST request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { onboardingCompleted } = await req.json();
    console.log(`🔄 Updating onboarding status for user ${userId} to:`, onboardingCompleted);

    if (typeof onboardingCompleted !== 'boolean') {
      console.log("❌ Invalid onboardingCompleted type:", typeof onboardingCompleted);
      return NextResponse.json({ error: "onboardingCompleted must be a boolean" }, { status: 400 });
    }

    // Update user's onboarding status
    const { error } = await supabaseAdmin
      .from('users')
      .update({ 
        onboardingcompleted: onboardingCompleted,
        updatedAt: new Date().toISOString()
      })
      .eq('clerkId', userId);

    if (error) {
      console.error("❌ Error updating onboarding status:", error);
      return NextResponse.json({ error: "Failed to update onboarding status" }, { status: 500 });
    }

    console.log("✅ Successfully updated onboarding status in database");
    return NextResponse.json({ 
      success: true, 
      onboardingCompleted 
    });

  } catch (error) {
    console.error("❌ Update onboarding status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
