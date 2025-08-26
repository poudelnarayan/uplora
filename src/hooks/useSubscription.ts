import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { BillingInfo, SubscriptionStatus, TrialInfo } from "@/types/subscription";
import { subscriptionConfig, getTrialEndDate, getTrialDaysRemaining, isTrialExpired } from "@/config/subscription";

interface UseSubscriptionReturn {
  billingInfo: BillingInfo | null;
  loading: boolean;
  error: string | null;
  trialInfo: TrialInfo | null;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  isTrialExpired: boolean;
  subscriptionStatus: SubscriptionStatus | null;
  refreshBillingInfo: () => Promise<void>;
  changePlan: (planId: string, cycle: "monthly" | "yearly") => Promise<void>;
  cancelSubscription: () => Promise<void>;
  pauseSubscription: () => Promise<void>;
  resumeSubscription: () => Promise<void>;
  extendTrial: (days: number) => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useUser();
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const CACHE_KEY = "billing-info-cache";
  const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
  // shared cache to prevent duplicate requests across renders
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g: any = globalThis as any;
  if (!g.__billingShared) {
    g.__billingShared = { data: null as BillingInfo | null, t: 0, inflight: null as Promise<BillingInfo> | null };
  }
  const shared = g.__billingShared as { data: BillingInfo | null; t: number; inflight: Promise<BillingInfo> | null };

  const fetchBillingInfo = async () => {
    if (!user?.id) return;
    
    try {
      // Serve fresh cache if available
      if (shared.data && Date.now() - shared.t < CACHE_TTL_MS) {
        setBillingInfo(shared.data);
        setLoading(false);
        return;
      }

      // If a request is in-flight, await it
      if (shared.inflight) {
        const data = await shared.inflight;
        setBillingInfo(data);
        setLoading(false);
        return;
      }

      if (!billingInfo) setLoading(true);
      setError(null);
      
      shared.inflight = (async () => {
        const response = await fetch("/api/subscription/billing-info", { cache: 'no-store' });
        if (!response.ok) throw new Error("Failed to fetch billing information");
        const data = (await response.json()) as BillingInfo;
        shared.data = data;
        shared.t = Date.now();
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, t: shared.t })); } catch {}
        return data;
      })();

      const data = await shared.inflight;
      setBillingInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      shared.inflight = null;
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

  const resumeSubscription = async () => {
    try {
      const response = await fetch("/api/subscription/resume", {
        method: "POST"
      });
      
      if (!response.ok) {
        throw new Error("Failed to resume subscription");
      }
      
      await refreshBillingInfo();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to resume subscription");
    }
  };

  const extendTrial = async (days: number) => {
    try {
      const response = await fetch("/api/subscription/extend-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ additionalDays: days })
      });
      
      if (!response.ok) {
        throw new Error("Failed to extend trial");
      }
      
      await refreshBillingInfo();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Failed to extend trial");
    }
  };

  // Calculate trial information
  const trialInfo: TrialInfo | null = (() => {
    if (!billingInfo?.subscription) return null;
    
    const subscription = billingInfo.subscription;
    const isActive = subscription.status === "trial";
    
    if (!subscription.trialStart || !subscription.trialEnd) return null;
    
    const startDate = new Date(subscription.trialStart);
    const endDate = new Date(subscription.trialEnd);
    const daysRemaining = getTrialDaysRemaining(endDate);
    const expired = isTrialExpired(endDate);
    
    const gracePeriodEnd = new Date(endDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + subscriptionConfig.trialConfig.gracePeriodDays);
    const isInGracePeriod = expired && new Date() <= gracePeriodEnd;
    
    return {
      isActive,
      startDate,
      endDate,
      daysRemaining,
      isExpired: expired,
      gracePeriodEnd,
      isInGracePeriod
    };
  })();

  const isTrialActive = trialInfo?.isActive || false;
  const trialDaysRemaining = trialInfo?.daysRemaining || 0;
  const isTrialExpiredValue = trialInfo?.isExpired || false;
  const subscriptionStatus = billingInfo?.subscription?.status || null;

  useEffect(() => {
    // Hydrate from cache immediately for instant UI
    try {
      if (shared.data && Date.now() - shared.t < CACHE_TTL_MS) {
        setBillingInfo(shared.data);
        setLoading(false);
      } else {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (cached && Date.now() - cached.t < CACHE_TTL_MS) {
          setBillingInfo(cached.data);
          setLoading(false);
          shared.data = cached.data;
          shared.t = cached.t;
        }
      }
    } catch {}

    if (!(shared.data && Date.now() - shared.t < CACHE_TTL_MS)) {
      void fetchBillingInfo();
    }

    const onFocusOrVisible = () => { if (!document.hidden) void fetchBillingInfo(); };
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);
    return () => {
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [user?.id]);

  return {
    billingInfo,
    loading,
    error,
    trialInfo,
    isTrialActive,
    trialDaysRemaining,
    isTrialExpired: isTrialExpiredValue,
    subscriptionStatus,
    refreshBillingInfo,
    changePlan,
    cancelSubscription,
    pauseSubscription,
    resumeSubscription,
    extendTrial
  };
}