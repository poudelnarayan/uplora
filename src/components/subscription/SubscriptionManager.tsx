"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Calendar, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/components/ui/Notification";
import PricingCard from "./PricingCard";
import { subscriptionConfig } from "@/config/subscription";

const MotionDiv = motion.div as any;

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
}

export default function SubscriptionManager() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const notifications = useNotifications();

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

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

  const handleSubscribe = async (planId: string, cycle: 'monthly' | 'yearly') => {
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
      notifications.addNotification({
        type: 'error',
        title: 'Subscription Error',
        message: 'Failed to start subscription process',
      });
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

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;

    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediate: false }),
      });

      if (response.ok) {
        notifications.addNotification({
          type: 'success',
          title: 'Subscription Canceled',
          message: 'Your subscription will end at the current period',
        });
        await fetchSubscriptionStatus();
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      notifications.addNotification({
        type: 'error',
        title: 'Cancellation Error',
        message: 'Failed to cancel subscription',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Subscription Status */}
      {subscriptionStatus?.hasSubscription && (
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Badge variant={subscriptionStatus.trialActive ? 'secondary' : 'default'}>
                    {subscriptionStatus.trialActive ? 'Free Trial' : subscriptionStatus.status}
                  </Badge>
                  {subscriptionStatus.trialActive && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {subscriptionStatus.trialDaysRemaining} days remaining
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleBillingPortal}>
                    Manage Billing
                  </Button>
                  {!subscriptionStatus.cancelAtPeriodEnd && (
                    <Button variant="outline" onClick={handleCancelSubscription}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              {subscriptionStatus.cancelAtPeriodEnd && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Your subscription will end on{' '}
                    {subscriptionStatus.currentPeriodEnd 
                      ? new Date(subscriptionStatus.currentPeriodEnd * 1000).toLocaleDateString()
                      : 'the current period end'
                    }
                  </p>
                </div>
              )}

              {subscriptionStatus.paymentMethod && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">Payment Method</p>
                  <p className="text-sm text-muted-foreground">
                    {subscriptionStatus.paymentMethod.brand?.toUpperCase()} ending in {subscriptionStatus.paymentMethod.last4}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </MotionDiv>
      )}

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="flex items-center bg-muted rounded-lg p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
              billingCycle === 'yearly'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Yearly
            <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5">
              Save 40%
            </Badge>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid md:grid-cols-3 gap-8"
      >
        {subscriptionConfig.pricingTiers.map((tier) => (
          <PricingCard
            key={tier.id}
            planId={tier.id}
            name={tier.name}
            description={tier.description}
            monthlyPrice={tier.monthlyPrice}
            yearlyPrice={tier.yearlyPrice}
            features={tier.features}
            popular={tier.popular}
            currentPlan={false} // You can implement current plan detection
            billingCycle={billingCycle}
            onSubscribe={handleSubscribe}
          />
        ))}
      </MotionDiv>

      {/* Additional Info */}
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          All plans include a 7-day free trial. No credit card required to start.
        </p>
        <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>No setup fees</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>24/7 support</span>
          </div>
        </div>
      </div>
    </div>
  );
}