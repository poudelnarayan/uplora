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

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('has_active_subscription, subscription_status, subscription_plan')
      .eq('id', userId)
      .single();

    const { data: customer } = await supabaseAdmin
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', userId)
      .single();

    if (!customer) {
      return NextResponse.json({
        hasSubscription: user?.has_active_subscription || false,
        status: user?.subscription_status || null,
        trialActive: user?.subscription_status === 'trialing',
        trialDaysRemaining: 0,
        plan: user?.subscription_plan || null,
      });
    }

    const { data: subscription } = await supabaseAdmin
      .from('stripe_subscriptions')
      .select('subscription_id, price_id, status, current_period_start, current_period_end, cancel_at_period_end, payment_method_brand, payment_method_last4')
      .eq('customer_id', customer.customer_id)
      .single();

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: user?.has_active_subscription || false,
        status: user?.subscription_status || null,
        trialActive: user?.subscription_status === 'trialing',
        trialDaysRemaining: 0,
        plan: user?.subscription_plan || null,
      });
    }

    const isTrialing = subscription.status === 'trialing';
    const trialDaysRemaining = isTrialing && subscription.current_period_end
      ? Math.max(0, Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

    return NextResponse.json({
      hasSubscription: true,
      status: subscription.status,
      trialActive: isTrialing,
      trialDaysRemaining,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPriceId: subscription.price_id,
      plan: user?.subscription_plan || null,
      paymentMethod: {
        brand: subscription.payment_method_brand,
        last4: subscription.payment_method_last4,
      },
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json({ error: 'Failed to get subscription status' }, { status: 500 });
  }
}
