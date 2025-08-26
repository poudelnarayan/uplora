export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { BillingInfo, SubscriptionStatus } from "@/types/subscription";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user details from Clerk
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Mock billing info for now - replace with actual Stripe data
    const mockBillingInfo: BillingInfo = {
      subscription: {
        id: "sub_mock",
        userId: user.id,
        stripeSubscriptionId: "sub_stripe_mock",
        stripePriceId: "price_creator_monthly",
        status: "trialing" as SubscriptionStatus,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        cancelAtPeriodEnd: false,
        trialStart: new Date(user.createdAt),
        trialEnd: new Date(new Date(user.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date(user.createdAt),
        updatedAt: new Date()
      },
      paymentMethods: [],
      invoiceHistory: [],
      usage: {
        teamMembers: 0,
        videoUploads: 0,
        storageUsed: 0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        limits: {
          maxTeamMembers: 5,
          maxVideoUploads: 100,
          maxStorageBytes: 50 * 1024 * 1024 * 1024 // 50 GB
        }
      }
    };

    return NextResponse.json(mockBillingInfo);
  } catch (error) {
    console.error("Billing info error:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing information" },
      { status: 500 }
    );
  }
}