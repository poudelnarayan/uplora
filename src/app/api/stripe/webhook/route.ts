import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import Stripe from "stripe";

// Type extension for Stripe Subscription with period properties
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
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
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
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription') return;

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Get user ID from customer metadata
  const customer = await stripe.customers.retrieve(customerId);
  const userId = (customer as any).metadata?.userId;

  if (!userId) {
    console.error('No userId found in customer metadata');
    return;
  }

  // Update or create subscription record
  await supabaseAdmin
    .from('stripeSubscriptions')
    .upsert({
      customerId: customerId,
      subscriptionId: subscriptionId,
      status: 'active',
      updatedAt: new Date().toISOString(),
    }, {
      onConflict: 'customerId'
    });

  // Get plan information from session metadata
  const planId = session.metadata?.planId || 'creator';
  
  // Update user's subscription status
  await supabaseAdmin
    .from('users')
    .update({
      hasActiveSubscription: true,
      subscriptionStatus: 'active',
      subscriptionPlan: planId,
      subscriptionStartDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq('id', userId);

  console.log(`Checkout completed for customer: ${customerId}, user: ${userId}`);
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Get the price ID from the subscription
  const priceId = subscription.items.data[0]?.price?.id;

  // Get user ID from customer metadata
  const customer = await stripe.customers.retrieve(customerId);
  const userId = (customer as any).metadata?.userId;

  // Cast to our extended type for period properties
  const sub = subscription as SubscriptionWithPeriods;

  await supabaseAdmin
    .from('stripeSubscriptions')
    .upsert({
      customerId: customerId,
      subscriptionId: subscription.id,
      priceId: priceId,
      status: subscription.status as any,
      currentPeriodStart: sub.current_period_start,
      currentPeriodEnd: sub.current_period_end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      updatedAt: new Date().toISOString(),
    }, {
      onConflict: 'customerId'
    });

  // Update user's subscription status
  if (userId) {
    const hasActiveSubscription = ['active', 'trialing'].includes(subscription.status);
    
    // Determine plan from price ID
    let planId = 'creator'; // default
    if (priceId) {
      if (priceId.includes('starter')) planId = 'starter';
      else if (priceId.includes('pro')) planId = 'pro';
      else planId = 'creator';
    }
    
    await supabaseAdmin
      .from('users')
      .update({
        hasActiveSubscription: hasActiveSubscription,
        subscriptionStatus: subscription.status,
        subscriptionPlan: planId,
        subscriptionEndDate: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', userId);
  }

  console.log(`Subscription ${subscription.status} for customer: ${customerId}, user: ${userId}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  // Get user ID from customer metadata
  const customer = await stripe.customers.retrieve(customerId);
  const userId = (customer as any).metadata?.userId;
  
  // Update subscription status if needed
  if ((invoice as any).subscription && typeof (invoice as any).subscription === 'string') {
    await supabaseAdmin
      .from('stripeSubscriptions')
      .update({
        status: 'active',
        updatedAt: new Date().toISOString(),
      })
      .eq('customerId', customerId);

    // Update user's subscription status
    if (userId) {
      await supabaseAdmin
        .from('users')
        .update({
          hasActiveSubscription: true,
          subscriptionStatus: 'active',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', userId);
    }
  }

  console.log(`Payment succeeded for customer: ${customerId}, user: ${userId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  // Get user ID from customer metadata
  const customer = await stripe.customers.retrieve(customerId);
  const userId = (customer as any).metadata?.userId;
  
  // Update subscription status
  if ((invoice as any).subscription && typeof (invoice as any).subscription === 'string') {
    await supabaseAdmin
      .from('stripeSubscriptions')
      .update({
        status: 'past_due',
        updatedAt: new Date().toISOString(),
      })
      .eq('customerId', customerId);

    // Update user's subscription status
    if (userId) {
      await supabaseAdmin
        .from('users')
        .update({
          hasActiveSubscription: false,
          subscriptionStatus: 'past_due',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', userId);
    }
  }

  console.log(`Payment failed for customer: ${customerId}, user: ${userId}`);
}