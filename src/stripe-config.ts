/**
 * Pricing model: 3 tiers (Free / Creator / Team), each paid tier has a
 * monthly + yearly Stripe price (yearly = ~20% off).
 *
 * Stripe price IDs come from environment variables so production / staging
 * can use different test keys without code changes. Set them up in Stripe
 * Dashboard → Products and copy the resulting price IDs into your `.env`.
 */

export type PlanId = "free" | "creator" | "team";
export type BillingInterval = "monthly" | "yearly";

export interface PlanFeature {
  label: string;
  included: boolean;
  /** Optional small-print qualifier shown next to the label. */
  note?: string;
}

export interface Plan {
  id: PlanId;
  name: string;
  /** One-line elevator pitch for the plan. */
  tagline: string;
  description: string;
  /** Marketing headline price (monthly equivalent for yearly). */
  monthlyPrice: number;
  yearlyPriceMonthly: number; // shown as "$X/mo billed yearly"
  yearlyPriceTotal: number;   // total invoiced once a year
  /** Stripe price IDs — null for free tier. */
  priceIdMonthly: string | null;
  priceIdYearly: string | null;
  /** Showcase chip (e.g. "Most popular"). */
  badge?: string;
  /** Mark the visually emphasised middle card. */
  popular?: boolean;
  /** Feature list rendered inside the card. */
  features: PlanFeature[];
  /** Hard limits surfaced in the comparison table only. */
  limits: {
    seats: number;
    workspaces: number | "unlimited";
    platforms: number; // out of 8
    postsPerMonth: number | "unlimited";
    aiTitleCredits: number;
    aiTagCredits: number;
    aiThumbnailCredits: number;
  };
  cta: string;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Try Uplora end-to-end",
    description: "For trying Uplora end-to-end on a personal account.",
    monthlyPrice: 0,
    yearlyPriceMonthly: 0,
    yearlyPriceTotal: 0,
    priceIdMonthly: null,
    priceIdYearly: null,
    cta: "Start for free",
    features: [
      { label: "1 workspace, 1 seat", included: true },
      { label: "Up to 3 connected platforms", included: true },
      { label: "10 posts per month", included: true },
      { label: "Auto-publish to YouTube + 2 socials", included: true },
      { label: "Schedule for later", included: false },
      { label: "Editor → Owner approval workflow", included: false },
      { label: "AI title / tags / thumbnail", included: false },
      { label: "Email support", included: false, note: "community only" },
    ],
    limits: {
      seats: 1,
      workspaces: 1,
      platforms: 3,
      postsPerMonth: 10,
      aiTitleCredits: 0,
      aiTagCredits: 0,
      aiThumbnailCredits: 0,
    },
  },
  {
    id: "creator",
    name: "Creator",
    tagline: "Solo creators publishing to YouTube",
    description: "For solo creators publishing to YouTube every week.",
    monthlyPrice: 19,
    yearlyPriceMonthly: 15,
    yearlyPriceTotal: 180,
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_CREATOR_MONTHLY_PRICE_ID
      || process.env.STRIPE_CREATOR_MONTHLY_PRICE_ID
      || "",
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_CREATOR_YEARLY_PRICE_ID
      || process.env.STRIPE_CREATOR_YEARLY_PRICE_ID
      || "",
    badge: "Most popular",
    popular: true,
    cta: "Start with Creator",
    features: [
      { label: "1 workspace, 1 seat", included: true },
      { label: "YouTube channel publishing", included: true },
      { label: "Unlimited videos", included: true },
      { label: "Schedule + auto-publish", included: true },
      { label: "AI title rewriter", included: true, note: "100 / mo" },
      { label: "AI tag suggestions", included: true, note: "100 / mo" },
      { label: "AI thumbnail generator", included: true, note: "20 / mo" },
      { label: "Full analytics", included: true },
      { label: "Email support", included: true },
    ],
    limits: {
      seats: 1,
      workspaces: 1,
      platforms: 8,
      postsPerMonth: "unlimited",
      aiTitleCredits: 100,
      aiTagCredits: 100,
      aiThumbnailCredits: 20,
    },
  },
  {
    id: "team",
    name: "Team",
    tagline: "Small teams that need approvals before publish",
    description: "For small teams that need approval workflows before content goes live.",
    monthlyPrice: 49,
    yearlyPriceMonthly: 39,
    yearlyPriceTotal: 468,
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_TEAM_MONTHLY_PRICE_ID
      || process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID
      || process.env.STRIPE_STARTER_MONTHLY_PRICE_ID
      || "",
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_TEAM_YEARLY_PRICE_ID
      || process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID
      || process.env.STRIPE_STARTER_YEARLY_PRICE_ID
      || "",
    cta: "Start with Team",
    features: [
      { label: "Up to 5 seats", included: true, note: "$8/seat after" },
      { label: "Multiple YouTube channels", included: true },
      { label: "Unlimited videos", included: true },
      { label: "Multiple workspaces", included: true },
      { label: "Editor → Owner approval workflow", included: true },
      { label: "Role-based publish permissions", included: true },
      { label: "Bulk AI rewrites", included: true, note: "500 title + 500 tag credits / mo" },
      { label: "AI thumbnail generator", included: true, note: "100 / mo" },
      { label: "Full analytics + CSV export", included: true },
      { label: "Priority support", included: true },
    ],
    limits: {
      seats: 5,
      workspaces: "unlimited",
      platforms: 8,
      postsPerMonth: "unlimited",
      aiTitleCredits: 500,
      aiTagCredits: 500,
      aiThumbnailCredits: 100,
    },
  },
];

export function getPlanByPriceId(priceId: string): Plan | null {
  for (const plan of PLANS) {
    if (plan.priceIdMonthly === priceId || plan.priceIdYearly === priceId) {
      return plan;
    }
  }
  return null;
}

export function getPlanById(id: PlanId): Plan | null {
  return PLANS.find((p) => p.id === id) || null;
}

// ──────────────────────────────────────────────────────────────────────────
// Backwards-compat shim — older code imports `products` / `getProductByPriceId`.
// Map them onto PLANS so existing usages still compile while we migrate.
// ──────────────────────────────────────────────────────────────────────────
export const products = PLANS.filter((p) => p.id !== "free").map((p) => ({
  id: p.id,
  priceId: p.priceIdMonthly || "",
  name: `Uplora ${p.name}`,
  description: p.description,
  price: p.monthlyPrice,
  mode: "subscription" as const,
  features: p.features.filter((f) => f.included).map((f) => f.label),
  popular: !!p.popular,
}));

export const getProductById = (id: string) => products.find((p) => p.id === id);
export const getProductByPriceId = (priceId: string) =>
  products.find((p) => p.priceId === priceId);
