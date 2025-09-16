import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe, getPriceId } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId, cycle } = await req.json();
    
    if (!planId || !cycle) {
      return NextResponse.json({ error: "Missing planId or cycle" }, { status: 400 });
    }

    if (!['monthly', 'yearly'].includes(cycle)) {
      return NextResponse.json({ error: "Invalid cycle" }, { status: 400 });
    }

    // Get or create Stripe customer
    let { data: customer } = await supabaseAdmin
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', userId)
      .single();

    let customerId: string;

    if (!customer) {
      // Create new Stripe customer
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email, name')
        .eq('clerkId', userId)
        .single();

      const stripeCustomer = await stripe.customers.create({
        email: user?.email || '',
        name: user?.name || '',
        metadata: {
          userId: userId,
        },
      });

      // Save customer to database
      await supabaseAdmin
        .from('stripe_customers')
        .insert({
          user_id: userId,
          customer_id: stripeCustomer.id,
        });

      customerId = stripeCustomer.id;
    } else {
      customerId = customer.customer_id;
    }

    // Get price ID
    const priceId = getPriceId(planId, cycle);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscription?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
        metadata: {
          userId: userId,
          planId: planId,
          cycle: cycle,
        },
      },
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}