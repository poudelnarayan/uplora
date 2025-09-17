"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ProductCard from "@/components/subscription/ProductCard";
import SubscriptionManager from "@/components/subscription/SubscriptionManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, ExternalLink, CheckCircle, Crown } from "lucide-react";
import { products } from "@/stripe-config";
import { useNotifications } from "@/components/ui/Notification";
import AppShell from "@/components/layout/AppLayout";

const MotionDiv = motion.div as any;

export const dynamic = "force-dynamic";

interface SubscriptionStatus {
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
  currentPriceId?: string;
}
export default function SubscriptionPage() {
  const { user, isLoaded } = useUser();
  const notifications = useNotifications();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      fetchSubscriptionStatus();
    }
  }, [isLoaded, user]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/stripe/subscription-status');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (priceId: string, mode: 'subscription' | 'payment') => {
    setCheckoutLoading(true);
    try {
      // Extract planId and cycle from priceId (assuming format like "price_1S827kDS63fnzmVBBpk36xma")
      const planId = 'creator'; // Default to creator plan
      const cycle = 'monthly'; // Default to monthly
      
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          cycle,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      notifications.addNotification({
        type: 'error',
        title: 'Checkout Error',
        message: error instanceof Error ? error.message : 'Failed to start checkout process. Please try again.',
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleBillingPortal = async () => {
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
      notifications.addNotification({
        type: 'error',
        title: 'Billing Portal Error',
        message: 'Failed to open billing portal',
      });
    }
  };
  if (!isLoaded) return null;
  if (!user) return <RedirectToSignIn redirectUrl="/subscription" />;

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading subscription..." />
        </div>
      </AppShell>
    );
  }

  const currentProduct = subscriptionStatus?.currentPriceId 
    ? products.find(p => p.priceId === subscriptionStatus.currentPriceId)
    : null;
  return (
    <>
      <NextSeoNoSSR 
        title="Subscription" 
        description="Manage your Uplora subscription and billing." 
        noindex 
        nofollow 
      />
      
      <AppShell>
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <h1 className="text-4xl font-bold">Subscription Management</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Manage your Uplora subscription, billing, and plan upgrades.
            </p>
          </MotionDiv>

          {/* Subscription Manager */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SubscriptionManager 
              subscriptionStatus={subscriptionStatus}
              onRefresh={fetchSubscriptionStatus}
            />
          </MotionDiv>
          
          {/* Available Plans - Only show if no active subscription */}
          {!subscriptionStatus?.hasSubscription && (
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-center space-y-4 mb-8">
                <h2 className="text-2xl font-bold">Available Plans</h2>
                <p className="text-muted-foreground">
                  Choose the plan that best fits your needs
                </p>
              </div>
              
              <div className="grid md:grid-cols-1 gap-8 max-w-2xl mx-auto">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSubscribe={handleSubscribe}
                    isCurrentPlan={currentProduct?.id === product.id}
                    loading={checkoutLoading}
                  />
                ))}
              </div>
            </MotionDiv>
          )}

          {/* Additional Info */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Secure payments</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>24/7 support</span>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </>
    );
}