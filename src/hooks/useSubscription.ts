import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { BillingInfo, SubscriptionStatus } from "@/types/subscription";
import { subscriptionConfig, getTrialEndDate } from "@/config/subscription";

interface UseSubscriptionReturn {
  billingInfo: BillingInfo | null;
  loading: boolean;
  error: string | null;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  refreshBillingInfo: () => Promise<void>;
  changePlan: (planId: string, cycle: "monthly" | "yearly") => Promise<void>;
  cancelSubscription: () => Promise<void>;
  pauseSubscription: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useUser();
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBillingInfo = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/subscription/billing-info");
      if (!response.ok) {
        throw new Error("Failed to fetch billing information");
      }
      
      const data = await response.json();
      setBillingInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const refreshBillingInfo = async () => {
    await fetchBillingInfo();
  };

  const changePlan = async (planId: string, cycle: "monthly" | "yearly") => {
    try {
      const response = await fetch("/api/subscription/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, cycle })
      });
      
      if (!response.ok) {
        throw new Error("Failed to change plan");
      }
      
      await refreshBillingInfo();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to change plan");
    }
  };

  const cancelSubscription = async () => {
    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST"
      });
      
      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }
      
      await refreshBillingInfo();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to cancel subscription");
    }
  };

  const pauseSubscription = async () => {
    try {
      const response = await fetch("/api/subscription/pause", {
        method: "POST"
      });
      
      if (!response.ok) {
        throw new Error("Failed to pause subscription");
      }
      
      await refreshBillingInfo();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to pause subscription");
    }
  };

  // Calculate trial status
  const isTrialActive = billingInfo?.subscription?.status === "trialing" || 
                       billingInfo?.subscription?.status === "trial";
  
  const trialDaysRemaining = (() => {
    if (!isTrialActive || !billingInfo?.subscription?.trialEnd) return 0;
    
    const now = new Date();
    const trialEnd = new Date(billingInfo.subscription.trialEnd);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  })();

  useEffect(() => {
    fetchBillingInfo();
  }, [user?.id]);

  return {
    billingInfo,
    loading,
    error,
    isTrialActive,
    trialDaysRemaining,
    refreshBillingInfo,
    changePlan,
    cancelSubscription,
    pauseSubscription
  };
}