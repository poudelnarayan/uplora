import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/clerk-supabase-utils";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await safeAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First check user's subscription status in users table
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('hasActiveSubscription, subscriptionStatus, subscriptionPlan')
      .eq('id', userId)
      .single();

    // Get detailed subscription info from Stripe tables
    const { data: customer } = await supabaseAdmin
      .from('stripeCustomers')
      .select(`
        customerId,
        stripeSubscriptions (
          subscriptionId,
          priceId,
          status,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd,
          paymentMethodBrand,
          paymentMethodLast4
        )
      `)
      .eq('userId', userId)
      .single();

    // If no Stripe customer record, return user table status
    if (!customer) {
      return NextResponse.json({
        hasSubscription: user?.hasActiveSubscription || false,
        status: user?.subscriptionStatus || null,
        trialActive: user?.subscriptionStatus === 'trialing',
        trialDaysRemaining: 0,
        plan: user?.subscriptionPlan || null,
      });
    }

    const subscription = customer.stripeSubscriptions?.[0];
    
    // If no Stripe subscription, return user table status
    if (!subscription) {
      return NextResponse.json({
        hasSubscription: user?.hasActiveSubscription || false,
        status: user?.subscriptionStatus || null,
        trialActive: user?.subscriptionStatus === 'trialing',
        trialDaysRemaining: 0,
        plan: user?.subscriptionPlan || null,
      });
    }

    // Calculate trial info
    const isTrialing = subscription.status === 'trialing';
    const trialDaysRemaining = isTrialing && subscription.currentPeriodEnd
      ? Math.max(0, Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

    return NextResponse.json({
      hasSubscription: true,
      status: subscription.status,
      trialActive: isTrialing,
      trialDaysRemaining,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      currentPriceId: subscription.priceId,
      plan: user?.subscriptionPlan || null,
      paymentMethod: {
        brand: subscription.paymentMethodBrand,
        last4: subscription.paymentMethodLast4,
      },
    });

  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}