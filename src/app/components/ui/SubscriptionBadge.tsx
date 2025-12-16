"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import { Crown, Clock } from "lucide-react";
import { getProductByPriceId } from "@/stripe-config";

interface SubscriptionBadgeProps {
  className?: string;
  showTrialInfo?: boolean;
}

interface SubscriptionStatus {
  hasSubscription: boolean;
  status: string | null;
  trialActive: boolean;
  trialDaysRemaining: number;
  currentPriceId?: string;
}

export default function SubscriptionBadge({ 
  className = "", 
  showTrialInfo = true 
}: SubscriptionBadgeProps) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading || !subscriptionStatus?.hasSubscription) {
    return null;
  }

  const product = subscriptionStatus.currentPriceId 
    ? getProductByPriceId(subscriptionStatus.currentPriceId)
    : null;

  if (subscriptionStatus.trialActive && showTrialInfo) {
    return (
      <Badge variant="outline" className={`bg-blue-50 text-blue-700 border-blue-200 ${className}`}>
        <Clock className="h-3 w-3 mr-1" />
        Trial: {subscriptionStatus.trialDaysRemaining} days left
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`bg-green-50 text-green-700 border-green-200 ${className}`}>
      <Crown className="h-3 w-3 mr-1" />
      {product?.name || 'Uplora'} Subscriber
    </Badge>
  );
}