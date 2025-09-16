"use client";

import { createContext, useContext, ReactNode } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';

interface StripeContextType {
  stripe: Promise<Stripe | null>;
}

const StripeContext = createContext<StripeContextType | null>(null);

export function StripeProvider({ children }: { children: ReactNode }) {
  const stripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

  return (
    <StripeContext.Provider value={{ stripe }}>
      {children}
    </StripeContext.Provider>
  );
}

export function useStripe() {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error('useStripe must be used within StripeProvider');
  }
  return context;
}