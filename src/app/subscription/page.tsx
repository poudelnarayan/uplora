"use client";

import AppShell from "@/components/layout/AppShell";
import { Check, X, Calendar, CreditCard, ExternalLink, Crown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";

const MotionDiv = motion.div as any;

export const dynamic = "force-dynamic";

// Features for each plan
const features = {
  free: [
    "1 test upload only",
    "Preview videos online",
    "Try the request-for-publish flow",
    "Basic video management",
    "Community support"
  ],
  starter: [
    "5 team members",
    "10 video uploads per month",
    "Basic collaboration tools",
    "Email notifications",
    "Standard support",
    "100MB file uploads",
    "Basic analytics"
  ],
  creator: [
    "15 team members",
    "Unlimited video uploads",
    "Advanced collaboration",
    "Priority email notifications",
    "Priority support",
    "500MB file uploads",
    "Advanced analytics",
    "Custom branding",
    "Bulk video scheduling"
  ],
  pro: [
    "Unlimited team members",
    "Unlimited video uploads",
    "Advanced collaboration",
    "Real-time notifications",
    "24/7 priority support",
    "2GB file uploads",
    "Advanced analytics",
    "Custom branding",
    "Bulk video scheduling",
    "API access",
    "White-label solution"
  ]
};

function FeatureItem({ included, text }: { included: boolean; text: string }) {
  return (
    <li className="flex items-start gap-3">
      {included ? (
        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
      ) : (
        <X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      )}
      <span className={included ? "text-foreground" : "text-muted-foreground"}>{text}</span>
    </li>
  );
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"billing" | "plans">("billing");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // Mock current plan data - replace with actual user data
  const currentPlan = {
    name: "Creator Plan",
    price: "$18.00",
    cycle: "month",
    status: "Trial",
    trialEnds: "August 26, 2025",
    nextBilling: "$18.00 after trial"
  };

  const handleSubscribe = (plan: "starter" | "creator" | "pro", cycle: "monthly" | "yearly") => {
    router.push(`/checkout?plan=${plan}&cycle=${cycle}`);
  };

  const openBillingPortal = () => {
    // Placeholder for Stripe billing portal
    window.open("https://billing.stripe.com", "_blank");
  };

  return (
    <AppShell>
      <NextSeoNoSSR title="Subscription" description="Manage your Uplora subscription and billing." />
      
      <div className="max-w-6xl mx-auto">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-border">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("billing")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "billing"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                Billing
              </button>
              <button
                onClick={() => setActiveTab("plans")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "plans"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                Plans
              </button>
            </nav>
          </div>
        </div>

        {/* Billing Tab */}
        {activeTab === "billing" && (
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Current Plan Card */}
            <div className="card p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Current Plan</span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{currentPlan.name}</h2>
                  <p className="text-muted-foreground">{currentPlan.price} / {currentPlan.cycle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    {currentPlan.status}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Trial ends</span>
                  </div>
                  <p className="font-medium text-foreground">{currentPlan.trialEnds}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Amount</span>
                  </div>
                  <p className="font-medium text-foreground">{currentPlan.nextBilling}</p>
                </div>
              </div>

              {/* Trial Notice */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-lg">🎉</span>
                  <div>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>You're on a free trial!</strong> Your trial ends on {currentPlan.trialEnds}. After that, you'll be charged {currentPlan.nextBilling}.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab("plans")}
                  className="btn btn-primary"
                >
                  Change Plan
                </button>
                <button className="btn btn-secondary">
                  Pause Subscription
                </button>
                <button className="btn btn-outline text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20">
                  Cancel Subscription
                </button>
              </div>
            </div>

            {/* Billing Portal */}
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Stripe Billing Portal</h3>
                  <p className="text-sm text-muted-foreground">
                    Access billing history, payment methods, and invoices
                  </p>
                </div>
                <button
                  onClick={openBillingPortal}
                  className="btn btn-outline flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Portal
                </button>
              </div>
            </div>
          </MotionDiv>
        )}

        {/* Plans Tab */}
        {activeTab === "plans" && (
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Billing Toggle */}
            <div className="flex justify-center">
              <div className="flex items-center gap-4 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    billingCycle === "monthly"
                      ? "bg-green-500 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all relative ${
                    billingCycle === "yearly"
                      ? "bg-green-500 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Yearly
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    40% OFF
                  </span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Free trial</span>
                  <div className="w-8 h-4 bg-green-500 rounded-full relative">
                    <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Starter Plan */}
              <div className="card p-6 relative">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">Starter</h3>
                  <p className="text-muted-foreground text-sm mb-4">Best for beginner creators</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      ${billingCycle === "monthly" ? "9" : "90"}
                    </span>
                    <span className="text-muted-foreground">
                      /{billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {features.starter.map((feature) => (
                    <FeatureItem key={feature} included={true} text={feature} />
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe("starter", billingCycle)}
                  className="btn btn-primary w-full"
                >
                  Start 7 day free trial →
                </button>
                
                <p className="text-xs text-muted-foreground text-center mt-3">
                  💚 $0.00 due today, cancel anytime
                </p>
              </div>

              {/* Creator Plan - Current/Popular */}
              <div className="card p-6 relative border-2 border-green-500 bg-green-50/50 dark:bg-green-900/10">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="flex gap-2">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      YOUR CURRENT PLAN
                    </span>
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Most popular
                    </span>
                  </div>
                </div>

                <div className="mb-6 mt-4">
                  <h3 className="text-xl font-bold text-foreground mb-2">Creator</h3>
                  <p className="text-muted-foreground text-sm mb-4">Best for growing creators</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      ${billingCycle === "monthly" ? "18" : "180"}
                    </span>
                    <span className="text-muted-foreground">
                      /{billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {features.creator.map((feature) => (
                    <FeatureItem key={feature} included={true} text={feature} />
                  ))}
                </ul>

                <button
                  disabled
                  className="btn btn-secondary w-full opacity-75 cursor-not-allowed"
                >
                  Current Plan
                </button>
                
                <p className="text-xs text-muted-foreground text-center mt-3">
                  💚 You're on this plan
                </p>
              </div>

              {/* Pro Plan */}
              <div className="card p-6 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Best deal
                  </span>
                </div>

                <div className="mb-6 mt-4">
                  <h3 className="text-xl font-bold text-foreground mb-2">Pro</h3>
                  <p className="text-muted-foreground text-sm mb-4">Best for scaling brands</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      ${billingCycle === "monthly" ? "49" : "490"}
                    </span>
                    <span className="text-muted-foreground">
                      /{billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {features.pro.map((feature) => (
                    <FeatureItem key={feature} included={true} text={feature} />
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe("pro", billingCycle)}
                  className="btn btn-primary w-full"
                >
                  Start 7 day free trial →
                </button>
                
                <p className="text-xs text-muted-foreground text-center mt-3">
                  💚 $0.00 due today, cancel anytime
                </p>
              </div>
            </div>

            {/* Free Plan Info */}
            <div className="card p-6 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Free Plan</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Limited access for evaluation only
                  </p>
                  <ul className="space-y-1">
                    {features.free.map((feature) => (
                      <FeatureItem key={feature} included={true} text={feature} />
                    ))}
                  </ul>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-foreground mb-2">$0</div>
                  <button
                    onClick={() => router.push("/upload")}
                    className="btn btn-outline"
                  >
                    Try Free
                  </button>
                </div>
              </div>
            </div>

            {/* Enterprise */}
            <div className="card p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Enterprise</h3>
                <p className="text-muted-foreground mb-4">
                  Custom solutions for large organizations with advanced needs
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => router.push("/contact")}
                    className="btn btn-primary"
                  >
                    Contact Sales
                  </button>
                  <button
                    onClick={() => router.push("/contact")}
                    className="btn btn-outline"
                  >
                    Schedule Demo
                  </button>
                </div>
              </div>
            </div>
          </MotionDiv>
        )}
      </div>
    </AppShell>
  );
}