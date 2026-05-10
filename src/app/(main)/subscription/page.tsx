"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { NextSeoNoSSR } from "@/app/components/seo/NoSSRSeo";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner";
import SubscriptionManager from "@/app/components/subscription/SubscriptionManager";
import { Button } from "@/app/components/ui/button";
import { Check, Minus, Sparkles, Shield, CreditCard, Zap } from "lucide-react";
import { PLANS, type Plan, type BillingInterval } from "@/stripe-config";
import { useNotifications } from "@/app/components/ui/Notification";
import AppShell from "@/app/components/layout/AppLayout";
import { cn } from "@/lib/utils";

const MotionDiv = motion.div as any;

export const dynamic = "force-dynamic";

interface SubscriptionStatus {
  hasSubscription: boolean;
  status: string | null;
  trialActive: boolean;
  trialDaysRemaining: number;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
  paymentMethod?: { brand?: string; last4?: string };
  currentPriceId?: string;
}

export default function SubscriptionPage() {
  const { user, isLoaded } = useUser();
  const notifications = useNotifications();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingInterval>("yearly");

  useEffect(() => {
    if (isLoaded && user) fetchSubscriptionStatus();
  }, [isLoaded, user]);

  const fetchSubscriptionStatus = async () => {
    try {
      const r = await fetch("/api/stripe/subscription-status");
      if (r.ok) setSubscriptionStatus(await r.json());
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = useMemo<Plan | null>(() => {
    if (!subscriptionStatus?.currentPriceId) return null;
    return PLANS.find(
      (p) => p.priceIdMonthly === subscriptionStatus.currentPriceId || p.priceIdYearly === subscriptionStatus.currentPriceId,
    ) || null;
  }, [subscriptionStatus?.currentPriceId]);

  const handleSubscribe = async (plan: Plan) => {
    if (plan.id === "free") {
      notifications.addNotification({
        type: "info",
        title: "You're on the free plan",
        message: "Upgrade any time from this page.",
      });
      return;
    }
    setCheckoutLoading(plan.id);
    try {
      const r = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, cycle: billing }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Failed to start checkout");
      }
      const { url } = await r.json();
      window.location.href = url;
    } catch (e) {
      notifications.addNotification({
        type: "error",
        title: "Checkout error",
        message: e instanceof Error ? e.message : "Try again",
      });
    } finally {
      setCheckoutLoading(null);
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

  return (
    <>
      <NextSeoNoSSR title="Pricing" description="Plans for solo creators and teams" noindex nofollow />

      <AppShell>
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Hero — tighter than before, no oversized vertical spacing */}
          <MotionDiv
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-center space-y-1.5 sm:space-y-2 mb-4 sm:mb-6"
          >
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              Plans that grow with your team
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              Pick a plan that fits how you publish today. Upgrade or downgrade any time.
            </p>
          </MotionDiv>

          {/* Active subscription manager */}
          {subscriptionStatus?.hasSubscription && (
            <MotionDiv
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className="mb-6"
            >
              <SubscriptionManager subscriptionStatus={subscriptionStatus} onRefresh={fetchSubscriptionStatus} />
            </MotionDiv>
          )}

          {/* Billing toggle — tight spacing on both sides */}
          <div className="flex justify-center mb-4 sm:mb-5">
            <BillingToggle value={billing} onChange={setBilling} />
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-8 sm:mb-10">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                billing={billing}
                isCurrent={currentPlan?.id === plan.id}
                loading={checkoutLoading === plan.id}
                onSelect={() => handleSubscribe(plan)}
              />
            ))}
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-muted-foreground mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-emerald-600" />
              Stripe-secured payments
            </div>
            <div className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-600" />
              Cancel any time
            </div>
            <div className="inline-flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              No setup fees
            </div>
          </div>

          {/* Comparison table — desktop only, mobile users have the per-card list above */}
          <div className="hidden md:block mb-10">
            <ComparisonTable billing={billing} currentPlanId={currentPlan?.id || null} />
          </div>

          {/* AI features teaser */}
          <div className="mb-8 sm:mb-10">
            <AIPathTeaser />
          </div>

          {/* FAQ */}
          <FAQ />
        </div>
      </AppShell>
    </>
  );
}

// ============================================================================
// BillingToggle
// ============================================================================
function BillingToggle({ value, onChange }: { value: BillingInterval; onChange: (v: BillingInterval) => void }) {
  return (
    <div className="inline-flex items-center p-1 rounded-lg bg-muted/40 border border-border/60">
      <button
        type="button"
        onClick={() => onChange("monthly")}
        aria-pressed={value === "monthly"}
        className={cn(
          "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
          value === "monthly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange("yearly")}
        aria-pressed={value === "yearly"}
        className={cn(
          "px-4 py-1.5 rounded-md text-sm font-medium transition-all inline-flex items-center gap-2",
          value === "yearly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        )}
      >
        Yearly
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          Save 20%
        </span>
      </button>
    </div>
  );
}

// ============================================================================
// PlanCard
// ============================================================================
function PlanCard({
  plan, billing, isCurrent, loading, onSelect,
}: {
  plan: Plan;
  billing: BillingInterval;
  isCurrent: boolean;
  loading: boolean;
  onSelect: () => void;
}) {
  const monthlyEquivalent = billing === "yearly" ? plan.yearlyPriceMonthly : plan.monthlyPrice;
  const isFree = plan.id === "free";

  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-card p-5 sm:p-6 flex flex-col",
        plan.popular ? "border-primary/60 shadow-lg ring-1 ring-primary/20" : "border-border/60",
      )}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground shadow">
            <Sparkles className="h-3 w-3" />
            {plan.badge}
          </span>
        </div>
      )}

      <div className="space-y-1 mb-4">
        <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-snug">{plan.tagline}</p>
      </div>

      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-3xl sm:text-4xl font-bold text-foreground">${monthlyEquivalent}</span>
        {!isFree && <span className="text-sm text-muted-foreground">/mo</span>}
      </div>
      <p className="text-[11px] text-muted-foreground h-4 mb-5">
        {isFree
          ? "Free forever"
          : billing === "yearly"
            ? `$${plan.yearlyPriceTotal} billed yearly`
            : "Billed monthly"}
      </p>

      <Button
        className="w-full mb-5"
        variant={plan.popular ? "default" : "outline"}
        disabled={isCurrent || loading}
        onClick={onSelect}
      >
        {isCurrent ? "Current plan" : loading ? "Redirecting…" : plan.cta}
      </Button>

      <ul className="space-y-2.5 text-sm flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5">
            {f.included ? (
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5" />
            )}
            <span className={cn("flex-1", !f.included && "text-muted-foreground/70")}>
              {f.label}
              {f.note && (
                <span className="block text-[11px] text-muted-foreground/70 leading-tight mt-0.5">
                  {f.note}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// ComparisonTable
// ============================================================================
function ComparisonTable({ billing, currentPlanId }: { billing: BillingInterval; currentPlanId: string | null }) {
  const rows: Array<{ label: string; render: (p: Plan) => React.ReactNode }> = [
    { label: "Workspaces", render: (p) => p.limits.workspaces === "unlimited" ? "Unlimited" : p.limits.workspaces },
    { label: "Seats included", render: (p) => p.limits.seats },
    { label: "Connected platforms", render: (p) => `${p.limits.platforms} of 8` },
    { label: "Posts per month", render: (p) => p.limits.postsPerMonth === "unlimited" ? "Unlimited" : p.limits.postsPerMonth },
    { label: "Approval workflow", render: (p) => p.id !== "free" && p.features.find((f) => f.label.includes("approval"))?.included ? <Check className="h-4 w-4 text-emerald-600" /> : <Minus className="h-4 w-4 text-muted-foreground/40" /> },
    { label: "AI title rewrites / mo", render: (p) => p.limits.aiTitleCredits || <Minus className="h-4 w-4 text-muted-foreground/40" /> },
    { label: "AI tag credits / mo", render: (p) => p.limits.aiTagCredits || <Minus className="h-4 w-4 text-muted-foreground/40" /> },
    { label: "AI cover images / mo", render: (p) => p.limits.aiThumbnailCredits || <Minus className="h-4 w-4 text-muted-foreground/40" /> },
  ];

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60">
        <h3 className="text-base font-semibold text-foreground">Compare features</h3>
        <p className="text-xs text-muted-foreground">Detailed limits for every plan.</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/20">
            <th className="text-left px-5 py-3 font-medium text-muted-foreground"></th>
            {PLANS.map((p) => (
              <th key={p.id} className={cn(
                "text-left px-5 py-3 font-semibold",
                currentPlanId === p.id && "text-primary",
              )}>
                {p.name}
                {p.id !== "free" && (
                  <span className="block text-xs font-normal text-muted-foreground">
                    ${billing === "yearly" ? p.yearlyPriceMonthly : p.monthlyPrice}/mo
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/40 last:border-0">
              <td className="px-5 py-3 text-muted-foreground">{row.label}</td>
              {PLANS.map((p) => (
                <td key={p.id} className="px-5 py-3 font-medium">
                  {row.render(p)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// AIPathTeaser
// ============================================================================
function AIPathTeaser() {
  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 to-accent/5 p-5 sm:p-8">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-foreground">AI features included on Creator and Team</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            We're shipping AI assists that save you hours per video. Credits refresh every billing cycle.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { title: "Rewrite titles", desc: "SEO-optimized variants for YouTube + each platform." },
          { title: "Suggest tags", desc: "Pulls 10–15 keywords from your title + description." },
          { title: "Generate covers", desc: "Auto-generate thumbnail images from your prompt." },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-border/40 bg-background/60 p-4">
            <div className="text-sm font-semibold text-foreground">{f.title}</div>
            <p className="text-xs text-muted-foreground mt-1 leading-snug">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// FAQ
// ============================================================================
function FAQ() {
  const faqs = [
    {
      q: "Can I switch plans later?",
      a: "Yes. Upgrades take effect immediately and you're prorated. Downgrades take effect at the end of your current billing cycle.",
    },
    {
      q: "What happens if I exceed my AI credits?",
      a: "AI features are paused until the next billing cycle resets your allowance. We never auto-charge you for overages.",
    },
    {
      q: "Do you offer refunds?",
      a: "Yes — within 14 days of payment, no questions asked. Email contact@uplora.io.",
    },
    {
      q: "What does 'seat' mean?",
      a: "A seat is one team member who can log in. Owners always count as one seat. Adding additional members beyond your plan's included seats is $8/seat/month on Team.",
    },
    {
      q: "Do you store my social platform passwords?",
      a: "No. We use OAuth tokens that the platforms issue to us. You can revoke access at any time from /social.",
    },
  ];
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-foreground text-center">Frequently asked questions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {faqs.map((f, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-card p-4 sm:p-5">
            <div className="text-sm font-semibold text-foreground mb-1.5">{f.q}</div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
