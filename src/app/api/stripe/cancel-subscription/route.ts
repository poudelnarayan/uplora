import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { immediate = false } = await req.json();

    // Get user's subscription
    const { data: customer } = await supabaseAdmin
      .from('stripe_customers')
      .select(`
        customer_id,
        stripe_subscriptions (
          subscription_id,
          status
        )
      `)
      .eq('user_id', userId)
      .single();

    if (!customer?.stripe_subscriptions?.[0]) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    const subscription = customer.stripe_subscriptions[0];

    if (immediate) {
      // Cancel immediately
      await stripe.subscriptions.cancel(subscription.subscription_id);
    } else {
      // Cancel at period end
      await stripe.subscriptions.update(subscription.subscription_id, {
        cancel_at_period_end: true,
      });
    }

    return NextResponse.json({ 
      success: true,
      message: immediate ? "Subscription canceled immediately" : "Subscription will cancel at period end"
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}