import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import Stripe from "stripe";

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

  // Update or create subscription record
  await supabaseAdmin
    .from('stripe_subscriptions')
    .upsert({
      customer_id: customerId,
      subscription_id: subscriptionId,
      status: 'active',
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'customer_id'
    });

  console.log(`Checkout completed for customer: ${customerId}`);
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Get the price ID from the subscription
  const priceId = subscription.items.data[0]?.price?.id;

  await supabaseAdmin
    .from('stripe_subscriptions')
    .upsert({
      customer_id: customerId,
      subscription_id: subscription.id,
      price_id: priceId,
      status: subscription.status as any,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'customer_id'
    });

  console.log(`Subscription ${subscription.status} for customer: ${customerId}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  // Update subscription status if needed
  if (invoice.subscription) {
    await supabaseAdmin
      .from('stripe_subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('customer_id', customerId);
  }

  console.log(`Payment succeeded for customer: ${customerId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  // Update subscription status
  if (invoice.subscription) {
    await supabaseAdmin
      .from('stripe_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('customer_id', customerId);
  }

  console.log(`Payment failed for customer: ${customerId}`);
}