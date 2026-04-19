import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import Stripe from "stripe";

type SubscriptionWithPeriods = Stripe.Subscription & {
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
};

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription') return;

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  const customer = await stripe.customers.retrieve(customerId);
  const userId = (customer as any).metadata?.userId;

  if (!userId) {
    console.error('No userId found in customer metadata');
    return;
  }

  await supabaseAdmin
    .from('stripe_subscriptions')
    .upsert({ customer_id: customerId, subscription_id: subscriptionId, status: 'active' }, { onConflict: 'customer_id' });

  const planId = session.metadata?.planId || 'creator';

  await supabaseAdmin
    .from('users')
    .update({
      has_active_subscription: true,
      subscription_status: 'active',
      subscription_plan: planId,
      subscription_start_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price?.id;

  const customer = await stripe.customers.retrieve(customerId);
  const userId = (customer as any).metadata?.userId;

  const sub = subscription as SubscriptionWithPeriods;

  await supabaseAdmin
    .from('stripe_subscriptions')
    .upsert({
      customer_id: customerId,
      subscription_id: subscription.id,
      price_id: priceId,
      status: subscription.status,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      cancel_at_period_end: sub.cancel_at_period_end,
    }, { onConflict: 'customer_id' });

  if (userId) {
    const hasActiveSubscription = ['active', 'trialing'].includes(subscription.status);
    let planId = 'creator';
    if (priceId) {
      if (priceId.includes('starter')) planId = 'starter';
      else if (priceId.includes('pro')) planId = 'pro';
    }

    await supabaseAdmin
      .from('users')
      .update({
        has_active_subscription: hasActiveSubscription,
        subscription_status: subscription.status,
        subscription_plan: planId,
        subscription_end_date: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  const userId = (customer as any).metadata?.userId;

  if ((invoice as any).subscription && typeof (invoice as any).subscription === 'string') {
    await supabaseAdmin
      .from('stripe_subscriptions')
      .update({ status: 'active' })
      .eq('customer_id', customerId);

    if (userId) {
      await supabaseAdmin
        .from('users')
        .update({ has_active_subscription: true, subscription_status: 'active', updated_at: new Date().toISOString() })
        .eq('id', userId);
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  const userId = (customer as any).metadata?.userId;

  if ((invoice as any).subscription && typeof (invoice as any).subscription === 'string') {
    await supabaseAdmin
      .from('stripe_subscriptions')
      .update({ status: 'past_due' })
      .eq('customer_id', customerId);

    if (userId) {
      await supabaseAdmin
        .from('users')
        .update({ has_active_subscription: false, subscription_status: 'past_due', updated_at: new Date().toISOString() })
        .eq('id', userId);
    }
  }
}
