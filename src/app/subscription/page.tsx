"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import AppShell from "@/components/layout/AppShell";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import { useSubscription } from "@/hooks/useSubscription";
import { subscriptionConfig, formatPrice } from "@/config/subscription";
import SubscriptionHeader from "@/components/subscription/SubscriptionHeader/SubscriptionHeader";
import BillingTab from "@/components/subscription/BillingTab/BillingTab";
import PlansTab from "@/components/subscription/PlansTab/PlansTab";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
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
    trialInfo,
    isTrialActive,
    trialDaysRemaining,
    isTrialExpired,
    subscriptionStatus,
    changePlan,
    cancelSubscription,
    pauseSubscription,
    resumeSubscription
  } = useSubscription();

  // Current plan data
  const currentPlan = billingInfo?.subscription ? {
    name: "Creator Plan", // This would come from plan lookup
    price: formatPrice(18),
    cycle: "month",
    status: isTrialActive ? "Trial" : subscriptionStatus || "Unknown",
    trialEnds: trialInfo?.endDate ? trialInfo.endDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : "N/A",
    nextBilling: isTrialActive ? `${formatPrice(18)} after trial` : formatPrice(18),
    daysRemaining: trialDaysRemaining
  } : null;

  const handleSubscribe = async (planId: string, cycle: "monthly" | "yearly") => {
    try {
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

  const openBillingPortal = async () => {
    try {
      const response = await fetch("/api/subscription/billing-portal", {
        method: "POST"
      });
      
      if (response.ok) {
        const { url } = await response.json();
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Billing portal error:", error);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <div className="spinner-lg" />
            <p className="typography-body text-dark-secondary">Loading subscription details...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className={styles.container}>
          <div className={styles.errorState}>
            <h2 className="typography-h3">Unable to load subscription</h2>
            <p className="typography-body text-dark-secondary">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <>
      <SignedIn>
        <AppShell>
          <NextSeoNoSSR 
            title="Subscription" 
            description="Manage your Uplora subscription and billing." 
            noindex 
            nofollow 
          />
          
          <div className={styles.container}>
            <SubscriptionHeader
              title="Subscription & Billing"
              subtitle="Manage your plan, billing, and payment methods"
            />

            {/* Tab Navigation */}
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.tabNavigation}
            >
              <div className={styles.tabBorder}>
                <nav className={styles.tabNav}>
                  <button
                    onClick={() => setActiveTab("billing")}
                    className={`${styles.tabButton} ${
                      activeTab === "billing" ? styles.tabActive : ""
                    }`}
                  >
                    Billing
                  </button>
                  <button
                    onClick={() => setActiveTab("plans")}
                    className={`${styles.tabButton} ${
                      activeTab === "plans" ? styles.tabActive : ""
                    }`}
                  >
                    Plans
                  </button>
                </nav>
              </div>
            </MotionDiv>

            {/* Tab Content */}
            <MotionDiv
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "billing" && currentPlan && (
                <BillingTab
                  currentPlan={currentPlan}
                  trialInfo={trialInfo}
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
                  trialDaysRemaining={trialDaysRemaining}
                  isTrialActive={isTrialActive}
                />
              )}
            </MotionDiv>
          </div>
        </AppShell>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/subscription" />
      </SignedOut>
    </>
  );
}