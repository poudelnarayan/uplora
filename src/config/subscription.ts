// Subscription Configuration
// All pricing and trial settings configurable via environment variables

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
}

export interface TrialConfig {
  durationDays: number;
  enabled: boolean;
  features: string[];
}

export interface SubscriptionConfig {
  trialConfig: TrialConfig;
  pricingTiers: PricingTier[];
  yearlyDiscount: number;
  currency: string;
  stripePublishableKey?: string;
}

// Environment-driven configuration
export const subscriptionConfig: SubscriptionConfig = {
  trialConfig: {
    durationDays: parseInt(process.env.NEXT_PUBLIC_TRIAL_DAYS || "7"),
    enabled: process.env.NEXT_PUBLIC_TRIAL_ENABLED !== "false",
    features: [
      "Full access to all features",
      "Unlimited team members",
      "Unlimited video uploads",
      "Priority support"
    ]
  },
  
  pricingTiers: [
    {
      id: "starter",
      name: "Starter",
      description: "Best for beginner creators",
      monthlyPrice: parseInt(process.env.NEXT_PUBLIC_STARTER_MONTHLY || "9"),
      yearlyPrice: parseInt(process.env.NEXT_PUBLIC_STARTER_YEARLY || "90"),
      features: [
        "5 team members",
        "10 video uploads per month",
        "Basic collaboration tools",
        "Email notifications",
        "250MB file uploads",
        "Standard support"
      ],
      maxTeamMembers: 5,
      maxVideoUploads: 10,
      maxFileSize: "250MB",
      support: "Standard"
    },
    {
      id: "creator",
      name: "Creator",
      description: "Best for growing creators",
      monthlyPrice: parseInt(process.env.NEXT_PUBLIC_CREATOR_MONTHLY || "18"),
      yearlyPrice: parseInt(process.env.NEXT_PUBLIC_CREATOR_YEARLY || "180"),
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
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
};

// Helper functions
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