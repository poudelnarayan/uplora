// ===== SUBSCRIPTION CONFIGURATION SYSTEM =====
// Environment-driven configuration for trial-based subscription model

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  maxTeamMembers: number;
  maxVideoUploads: number;
  maxFileSize: string;
  support: string;
  popular?: boolean;
  enterprise?: boolean;
  stripeMonthlyPriceId?: string;
  stripeYearlyPriceId?: string;
}

export interface TrialConfig {
  durationDays: number;
  enabled: boolean;
  features: string[];
  gracePeriodDays: number; // Days after trial ends before access is restricted
}

export interface FeatureFlags {
  enableTeamCollaboration: boolean;
  enableAdvancedAnalytics: boolean;
  enableCustomBranding: boolean;
  enableAPIAccess: boolean;
  enablePrioritySupport: boolean;
}

export interface SubscriptionConfig {
  trialConfig: TrialConfig;
  pricingTiers: PricingTier[];
  yearlyDiscount: number;
  currency: string;
  stripePublishableKey?: string;
  featureFlags: FeatureFlags;
}

// Environment-driven configuration
export const subscriptionConfig: SubscriptionConfig = {
  trialConfig: {
    durationDays: parseInt(process.env.NEXT_PUBLIC_TRIAL_DAYS || "7"),
    enabled: process.env.NEXT_PUBLIC_TRIAL_ENABLED !== "false",
    gracePeriodDays: parseInt(process.env.NEXT_PUBLIC_GRACE_PERIOD_DAYS || "3"),
    features: [
      "Full access to all features",
      "Unlimited team members",
      "Unlimited video uploads",
      "Priority support",
      "Advanced analytics",
      "Custom branding"
    ]
  },
  
  pricingTiers: [
    {
      id: "starter",
      name: "Starter",
      description: "Best for beginner creators",
      monthlyPrice: parseInt(process.env.NEXT_PUBLIC_STARTER_MONTHLY || "9"),
      yearlyPrice: parseInt(process.env.NEXT_PUBLIC_STARTER_YEARLY || "90"),
      stripeMonthlyPriceId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
      stripeYearlyPriceId: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
      features: [
        "5 team members",
        "50 video uploads per month",
        "Basic collaboration tools",
        "Email notifications",
        "250MB file uploads",
        "Standard support"
      ],
      maxTeamMembers: 5,
      maxVideoUploads: 50,
      maxFileSize: "250MB",
      support: "Standard"
    },
    {
      id: "creator",
      name: "Creator",
      description: "Best for growing creators",
      monthlyPrice: parseInt(process.env.NEXT_PUBLIC_CREATOR_MONTHLY || "18"),
      yearlyPrice: parseInt(process.env.NEXT_PUBLIC_CREATOR_YEARLY || "180"),
      stripeMonthlyPriceId: process.env.STRIPE_CREATOR_MONTHLY_PRICE_ID,
      stripeYearlyPriceId: process.env.STRIPE_CREATOR_YEARLY_PRICE_ID,
      features: [
        "15 team members",
        "Unlimited video uploads",
        "Advanced collaboration",
        "Priority notifications",
        "500MB file uploads",
        "Advanced analytics",
        "Custom branding",
        "Priority support"
      ],
      maxTeamMembers: 15,
      maxVideoUploads: -1, // unlimited
      maxFileSize: "500MB",
      support: "Priority",
      popular: true
    },
    {
      id: "pro",
      name: "Pro",
      description: "Best for scaling brands",
      monthlyPrice: parseInt(process.env.NEXT_PUBLIC_PRO_MONTHLY || "49"),
      yearlyPrice: parseInt(process.env.NEXT_PUBLIC_PRO_YEARLY || "490"),
      stripeMonthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      stripeYearlyPriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
      features: [
        "Unlimited team members",
        "Unlimited video uploads",
        "Advanced collaboration",
        "Real-time notifications",
        "2GB file uploads",
        "Advanced analytics",
        "API access",
        "24/7 priority support",
        "Custom integrations"
      ],
      maxTeamMembers: -1, // unlimited
      maxVideoUploads: -1, // unlimited
      maxFileSize: "2GB",
      support: "24/7 Priority"
    }
  ],
  
  yearlyDiscount: parseInt(process.env.NEXT_PUBLIC_YEARLY_DISCOUNT || "40"),
  currency: process.env.NEXT_PUBLIC_CURRENCY || "USD",
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  
  featureFlags: {
    enableTeamCollaboration: process.env.NEXT_PUBLIC_ENABLE_TEAM_COLLABORATION !== "false",
    enableAdvancedAnalytics: process.env.NEXT_PUBLIC_ENABLE_ADVANCED_ANALYTICS !== "false",
    enableCustomBranding: process.env.NEXT_PUBLIC_ENABLE_CUSTOM_BRANDING !== "false",
    enableAPIAccess: process.env.NEXT_PUBLIC_ENABLE_API_ACCESS !== "false",
    enablePrioritySupport: process.env.NEXT_PUBLIC_ENABLE_PRIORITY_SUPPORT !== "false"
  }
};

// ===== UTILITY FUNCTIONS =====
export const formatPrice = (price: number, currency: string = "USD") => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const calculateYearlyPrice = (monthlyPrice: number, discount: number) => {
  const yearlyPrice = monthlyPrice * 12;
  return yearlyPrice - (yearlyPrice * discount / 100);
};

export const getTrialEndDate = (startDate: Date = new Date()) => {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + subscriptionConfig.trialConfig.durationDays);
  return endDate;
};

export const isTrialExpired = (trialEndDate: Date) => {
  return new Date() > trialEndDate;
};

export const getTrialDaysRemaining = (trialEndDate: Date) => {
  const now = new Date();
  const diffTime = trialEndDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

export const getPlanById = (planId: string): PricingTier | undefined => {
  return subscriptionConfig.pricingTiers.find(tier => tier.id === planId);
};

export const getFeatureAvailability = (planId: string, feature: keyof FeatureFlags): boolean => {
  const plan = getPlanById(planId);
  if (!plan) return false;
  
  return subscriptionConfig.featureFlags[feature];
};