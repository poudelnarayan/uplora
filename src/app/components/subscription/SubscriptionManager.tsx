"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import { 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Crown,
  TrendingUp,
  Users,
  BarChart3,
  Settings,
  ArrowRight,
  Zap,
  Shield
} from "lucide-react";
import { useNotifications } from "@/app/components/ui/Notification";

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
  currentPriceId?: string;
}

interface SubscriptionManagerProps {
  subscriptionStatus: SubscriptionStatus | null;
  onRefresh: () => void;
}

const plans = [
  {
    id: 'starter',
    name: "Starter",
    price: 9,
    features: ["5 accounts", "Basic analytics", "Email support"],
    limits: { accounts: 5, teamMembers: 1 }
  },
  {
    id: 'creator',
    name: "Creator", 
    price: 18,
    features: ["15 accounts", "Advanced analytics", "Team collaboration", "Priority support"],
    limits: { accounts: 15, teamMembers: 3 }
  },
  {
    id: 'pro',
    name: "Pro",
    price: 49,
    features: ["Unlimited accounts", "Advanced reporting", "White-label", "API access"],
    limits: { accounts: "Unlimited", teamMembers: "Unlimited" }
  }
];

export default function SubscriptionManager({ subscriptionStatus, onRefresh }: SubscriptionManagerProps) {
  const notifications = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleBillingPortal = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          cycle: 'monthly',
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
      notifications.addNotification({
        type: 'error',
        title: 'Upgrade Error',
        message: error instanceof Error ? error.message : 'Failed to start upgrade process',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trialing': return 'bg-blue-100 text-blue-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'trialing': return <Clock className="w-4 h-4" />;
      case 'past_due': return <AlertTriangle className="w-4 h-4" />;
      case 'canceled': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (!subscriptionStatus) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Subscription</h3>
            <p className="text-gray-600 mb-4">You don't have an active subscription</p>
            <Button onClick={() => setShowUpgradeModal(true)}>
              <Crown className="w-4 h-4 mr-2" />
              Choose a Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { hasSubscription, status, trialActive, trialDaysRemaining, currentPeriodEnd, cancelAtPeriodEnd, paymentMethod } = subscriptionStatus;

  if (!hasSubscription) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Subscription</h3>
            <p className="text-gray-600 mb-4">Choose a plan to unlock all features</p>
            <Button onClick={() => setShowUpgradeModal(true)}>
              <Crown className="w-4 h-4 mr-2" />
              View Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Current Subscription
            </CardTitle>
            <Badge className={getStatusColor(status || '')}>
              {getStatusIcon(status || '')}
              <span className="ml-1 capitalize">{status?.replace('_', ' ')}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Trial Status */}
          {trialActive && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">Free Trial Active</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Days remaining:</span>
                  <span className="font-medium text-blue-900">{trialDaysRemaining} days</span>
                </div>
                <Progress 
                  value={(7 - trialDaysRemaining) / 7 * 100} 
                  className="h-2"
                />
                <p className="text-xs text-blue-600">
                  Your trial ends in {trialDaysRemaining} days. Add a payment method to continue.
                </p>
              </div>
            </div>
          )}

          {/* Subscription Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Billing Information</h4>
              <div className="space-y-1 text-sm text-gray-600">
                {paymentMethod && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>{paymentMethod.brand?.toUpperCase()} •••• {paymentMethod.last4}</span>
                  </div>
                )}
                {currentPeriodEnd && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {cancelAtPeriodEnd ? 'Ends' : 'Renews'} on{' '}
                      {new Date(currentPeriodEnd * 1000).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Plan Features</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Team collaboration</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Advanced analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>Priority support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleBillingPortal}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage Billing
            </Button>
            <Button
              onClick={() => setShowUpgradeModal(true)}
              disabled={isLoading}
              className="flex-1"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>

          {/* Cancellation Notice */}
          {cancelAtPeriodEnd && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-yellow-900">Subscription Ending</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Your subscription will end on {currentPeriodEnd && new Date(currentPeriodEnd * 1000).toLocaleDateString()}.
                You can reactivate it anytime before then.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Upgrade Your Plan</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUpgradeModal(false)}
                >
                  ×
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card key={plan.id} className="relative">
                    {plan.id === 'creator' && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <div className="text-3xl font-bold">${plan.price}<span className="text-lg text-gray-500">/month</span></div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={isLoading}
                        className="w-full"
                        variant={plan.id === 'creator' ? 'default' : 'outline'}
                      >
                        {isLoading ? 'Processing...' : 'Upgrade to ' + plan.name}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 flex justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Secure payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </MotionDiv>
        </div>
      )}
    </div>
  );
}