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
          
          <div className="h-[calc(100vh-8rem)] overflow-hidden">
            <div className="h-full overflow-y-auto px-4 lg:px-0 space-y-6">
              {/* Clean Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold" style={{ color: '#222831' }}>Subscription</h1>
                <p className="text-sm" style={{ color: '#393E46' }}>Manage your plan and billing</p>
              </div>

              {/* Tab Navigation */}
              <div className="mb-6">
                <div className="border-b" style={{ borderColor: '#393E46' }}>
                <nav className="flex gap-8">
                  <button
                    onClick={() => setActiveTab("billing")}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "billing" 
                        ? "" 
                        : "border-transparent hover:opacity-80"
                    }`}
                    style={{
                      borderBottomColor: activeTab === "billing" ? '#00ADB5' : 'transparent',
                      color: activeTab === "billing" ? '#00ADB5' : '#393E46'
                    }}
                  >
                    Billing
                  </button>
                  <button
                    onClick={() => setActiveTab("plans")}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "plans" 
                        ? "" 
                        : "border-transparent hover:opacity-80"
                    }`}
                    style={{
                      borderBottomColor: activeTab === "plans" ? '#00ADB5' : 'transparent',
                      color: activeTab === "plans" ? '#00ADB5' : '#393E46'
                    }}
                  >
                    Plans
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div>
              {activeTab === "billing" && currentPlan && (
                <div className="rounded-lg p-6" style={{ backgroundColor: '#EEEEEE', border: `1px solid #393E46` }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold" style={{ color: '#222831' }}>{currentPlan.name}</h3>
                      <p className="text-sm" style={{ color: '#393E46' }}>{currentPlan.price} • {currentPlan.status}</p>
                    </div>
                  </div>
                  
                  {trialInfo?.isActive && (
                    <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: '#00ADB5', color: 'white' }}>
                      <p className="font-medium">Free Trial Active</p>
                      <p className="text-sm opacity-90">{currentPlan.daysRemaining} days remaining</p>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={handleChangePlan}
                      className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                      style={{ backgroundColor: '#222831', color: 'white' }}
                    >
                      Change Plan
                    </button>
                    <button 
                      onClick={openBillingPortal}
                      className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                      style={{ backgroundColor: '#393E46', color: 'white' }}
                    >
                      Billing Portal
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "plans" && (
                <div className="space-y-6">
                  {/* Billing Cycle Toggle */}
                  <div className="flex justify-center">
                    <div className="flex rounded-lg p-1" style={{ backgroundColor: '#393E46' }}>
                      <button
                        onClick={() => setBillingCycle("monthly")}
                        className={`px-4 py-2 rounded-md font-medium transition-all ${
                          billingCycle === "monthly" ? "" : "text-white"
                        }`}
                        style={{
                          backgroundColor: billingCycle === "monthly" ? '#00ADB5' : 'transparent',
                          color: billingCycle === "monthly" ? 'white' : '#EEEEEE'
                        }}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setBillingCycle("yearly")}
                        className={`px-4 py-2 rounded-md font-medium transition-all ${
                          billingCycle === "yearly" ? "" : "text-white"
                        }`}
                        style={{
                          backgroundColor: billingCycle === "yearly" ? '#00ADB5' : 'transparent',
                          color: billingCycle === "yearly" ? 'white' : '#EEEEEE'
                        }}
                      >
                        Yearly <span className="ml-1 text-xs">40% OFF</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Plans Grid */}
                  <div className="grid md:grid-cols-3 gap-6">
                    {subscriptionConfig.pricingTiers.map((tier) => (
                      <div 
                        key={tier.id}
                        className="rounded-lg p-6 transition-all hover:scale-105"
                        style={{ backgroundColor: '#EEEEEE', border: `2px solid ${tier.popular ? '#00ADB5' : '#393E46'}` }}
                      >
                        {tier.popular && (
                          <div className="text-center mb-4">
                            <span className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: '#00ADB5' }}>
                              Most Popular
                            </span>
                          </div>
                        )}
                        
                        <div className="text-center mb-6">
                          <h3 className="text-xl font-bold mb-2" style={{ color: '#222831' }}>{tier.name}</h3>
                          <div className="mb-4">
                            <span className="text-3xl font-bold" style={{ color: '#222831' }}>
                              {formatPrice(billingCycle === "monthly" ? tier.monthlyPrice : tier.yearlyPrice)}
                            </span>
                            <span className="text-sm" style={{ color: '#393E46' }}>
                              /{billingCycle === "monthly" ? "month" : "year"}
                            </span>
                          </div>
                        </div>
                        
                        <ul className="space-y-2 mb-6">
                          {tier.features.slice(0, 4).map((feature, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
                                <span className="text-xs text-white">✓</span>
                              </div>
                              <span style={{ color: '#222831' }}>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        
                        <button
                          onClick={() => handleSubscribe(tier.id, billingCycle)}
                          className="w-full py-3 rounded-lg font-medium transition-all hover:scale-105"
                          style={{ 
                            backgroundColor: tier.popular ? '#00ADB5' : '#222831', 
                            color: 'white' 
                          }}
                        >
                          {isTrialActive ? "Switch Plan" : "Start Free Trial"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </AppShell>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/subscription" />
      </SignedOut>
    </>
  );
}
              )}
            </MotionDiv>
            </div>
          </div>
        </AppShell>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/subscription" />
      </SignedOut>
    </>
  );
}