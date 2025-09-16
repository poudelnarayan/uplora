import Stripe from 'stripe';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  appInfo: {
    name: 'Uplora',
    version: '1.0.0',
  },
});

// Client-side Stripe instance (for frontend)
export const getStripe = async () => {
  const { loadStripe } = await import('@stripe/stripe-js');
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
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