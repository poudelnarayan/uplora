import Stripe from 'stripe';

// Server-side Stripe instance - lazy initialization
let stripeInstance: Stripe | null = null;

export const getStripeInstance = (): Stripe => {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-08-27.basil',
      appInfo: {
        name: 'Uplora',
        version: '1.0.0',
      },
    });
  }
  return stripeInstance;
};

// For backward compatibility
export const stripe = {
  get billingPortal() {
    return getStripeInstance().billingPortal;
  },
  get customers() {
    return getStripeInstance().customers;
  },
  get subscriptions() {
    return getStripeInstance().subscriptions;
  },
  get checkout() {
    return getStripeInstance().checkout;
  },
  get webhooks() {
    return getStripeInstance().webhooks;
  },
  get prices() {
    return getStripeInstance().prices;
  },
  get products() {
    return getStripeInstance().products;
  },
} as Stripe;

// Client-side Stripe instance (for frontend)
export const getStripe = async () => {
  const { loadStripe } = await import('@stripe/stripe-js');
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable is not set');
  }
  
  return loadStripe(publishableKey);
};

// Price IDs - these should match your Stripe dashboard
export const STRIPE_PRICES = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_starter_monthly',
    yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_starter_yearly',
  },
  creator: {
    monthly: process.env.STRIPE_CREATOR_MONTHLY_PRICE_ID || 'price_creator_monthly', 
    yearly: process.env.STRIPE_CREATOR_YEARLY_PRICE_ID || 'price_creator_yearly',
  },
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
  },
} as const;

// Helper to get price ID
export function getPriceId(planId: string, cycle: 'monthly' | 'yearly'): string {
  const plan = STRIPE_PRICES[planId as keyof typeof STRIPE_PRICES];
  if (!plan) {
    throw new Error(`Unknown plan: ${planId}`);
  }
  return plan[cycle];
}