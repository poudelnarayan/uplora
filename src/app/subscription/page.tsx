"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import AppShell from "@/components/layout/AppShell";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import { useSubscription } from "@/hooks/useSubscription";
import { subscriptionConfig } from "@/config/subscription";
import SubscriptionHeader from "@/components/subscription/SubscriptionHeader/SubscriptionHeader";
import TabNavigation from "@/components/subscription/TabNavigation/TabNavigation";
import BillingTab from "@/components/subscription/BillingTab/BillingTab";
import PlansTab from "@/components/subscription/PlansTab/PlansTab";
import styles from "./Subscription.module.css";

const MotionDiv = motion.div as any;

export const dynamic = "force-dynamic";

export default function SubscriptionPage() {
  const [activeTab, setActiveTab] = useState<"billing" | "plans">("billing");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  
  const {
    billingInfo,
    loading,
    error,
    isTrialActive,
    trialDaysRemaining,
    changePlan,
    cancelSubscription,
    pauseSubscription
  } = useSubscription();

  // Mock current plan data (replace with actual billing info)
  const currentPlan = {
    name: "Creator Plan",
    price: "$18.00",
    cycle: "month",
    status: isTrialActive ? "Trial" : "Active",
    trialEnds: "August 26, 2025",
    nextBilling: isTrialActive ? "$18.00 after trial" : "$18.00"
  };

  const handleSubscribe = async (planId: string, cycle: "monthly" | "yearly") => {
    try {
      // Redirect to Stripe Checkout or handle subscription
      const response = await fetch("/api/subscription/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, cycle })
      });
      
      if (response.ok) {
        const { checkoutUrl } = await response.json();
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error("Subscription error:", error);
    }
  };

  const handleChangePlan = () => {
    setActiveTab("plans");
  };

  const handlePauseSubscription = async () => {
    if (confirm("Are you sure you want to pause your subscription?")) {
      try {
        await pauseSubscription();
      } catch (error) {
        console.error("Pause subscription error:", error);
      }
    }
  };

  const handleCancelSubscription = async () => {
    if (confirm("Are you sure you want to cancel your subscription? This action cannot be undone.")) {
      try {
        await cancelSubscription();
      } catch (error) {
        console.error("Cancel subscription error:", error);
      }
    }
  };

  const openBillingPortal = () => {
    window.open("https://billing.stripe.com", "_blank");
  };

  if (loading) {
    return (
      <AppShell>
        <div className={styles.subscriptionContainer}>
          <div className="flex items-center justify-center py-12">
            <div className="spinner-lg" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <NextSeoNoSSR 
        title="Subscription" 
        description="Manage your Uplora subscription and billing." 
        noindex 
        nofollow 
      />
      
      <div className={styles.subscriptionContainer}>
        <SubscriptionHeader
          title="Subscription & Billing"
          subtitle="Manage your plan, billing, and payment methods"
        />

        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {activeTab === "billing" && (
          <BillingTab
            currentPlan={currentPlan}
            onChangePlan={handleChangePlan}
            onPauseSubscription={handlePauseSubscription}
            onCancelSubscription={handleCancelSubscription}
            onOpenBillingPortal={openBillingPortal}
          />
        )}

        {activeTab === "plans" && (
          <PlansTab
            billingCycle={billingCycle}
            onBillingCycleChange={setBillingCycle}
            currentPlanId="creator"
            onSubscribe={handleSubscribe}
          />
        )}
      </div>
    </AppShell>
  );
}