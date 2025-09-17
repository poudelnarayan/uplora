import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/lib/clerk-supabase-utils";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await safeAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Stripe customer ID
    const { data: customer, error } = await supabaseAdmin
      .from('stripeCustomers')
      .select('customerId')
      .eq('userId', userId)
      .single();

    if (error || !customer) {
      return NextResponse.json({ error: "No billing account found" }, { status: 404 });
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.customerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscription`,
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Billing portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}