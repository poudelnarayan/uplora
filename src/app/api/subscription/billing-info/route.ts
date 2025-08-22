export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { BillingInfo, SubscriptionStatus } from "@/types/subscription";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with subscription data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        // Add subscription-related fields when they exist
      }
    });

    if (!user) {
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
        trialStart: user.createdAt,
        trialEnd: new Date(user.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: user.createdAt,
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