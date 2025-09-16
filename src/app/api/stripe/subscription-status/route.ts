import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's subscription status
    const { data: customer } = await supabaseAdmin
      .from('stripe_customers')
      .select(`
        customer_id,
        stripe_subscriptions (
          subscription_id,
          price_id,
          status,
          current_period_start,
          current_period_end,
          cancel_at_period_end,
          payment_method_brand,
          payment_method_last4
        )
      `)
      .eq('user_id', userId)
      .single();

    if (!customer) {
      return NextResponse.json({
        hasSubscription: false,
        status: null,
        trialActive: false,
        trialDaysRemaining: 0,
      });
    }

    const subscription = customer.stripe_subscriptions?.[0];
    
    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        status: null,
        trialActive: false,
        trialDaysRemaining: 0,
      });
    }

    // Calculate trial info
    const isTrialing = subscription.status === 'trialing';
    const trialDaysRemaining = isTrialing && subscription.current_period_end
      ? Math.max(0, Math.ceil((subscription.current_period_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

    return NextResponse.json({
      hasSubscription: true,
      status: subscription.status,
      trialActive: isTrialing,
      trialDaysRemaining,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      paymentMethod: {
        brand: subscription.payment_method_brand,
        last4: subscription.payment_method_last4,
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