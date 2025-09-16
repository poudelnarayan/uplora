"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface SubscriptionData {
  hasSubscription: boolean;
  status: string | null;
  trialActive: boolean;
  trialDaysRemaining: number;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
  paymentMethod?: {
    brand?: string;
    last4?: string;
  };
}

export function useStripeSubscription() {
  const { user, isLoaded } = useUser();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/stripe/subscription-status');
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      } else {
        throw new Error('Failed to fetch subscription');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchSubscription();
    } else if (isLoaded && !user) {
      setLoading(false);
    }
  }, [user, isLoaded]);

  const createCheckoutSession = async (planId: string, cycle: 'monthly' | 'yearly') => {
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, cycle }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    }
  };

  const openBillingPortal = async () => {
    try {
      const response = await fetch('/api/stripe/billing-portal', {
        method: 'POST',
      });

      if (response.ok) {
        const { url } = await response.json();
        window.open(url, '_blank');
      } else {
        throw new Error('Failed to open billing portal');
      }
    } catch (error) {
      console.error('Billing portal error:', error);
      throw error;
    }
  };

  const cancelSubscription = async (immediate = false) => {
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediate }),
      });

      if (response.ok) {
        await fetchSubscription(); // Refresh subscription data
        return await response.json();
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  };

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscription,
    createCheckoutSession,
    openBillingPortal,
    cancelSubscription,
  };
}