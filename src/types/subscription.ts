// ===== SUBSCRIPTION TYPE DEFINITIONS =====
// Complete type system for trial-based subscription model with Stripe integration

export interface User {
  id: string;
  email: string;
  name?: string;
  stripeCustomerId?: string;
  subscriptionStatus: SubscriptionStatus;
  trialStartDate?: Date;
  trialEndDate?: Date;
  currentPlanId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionStatus = 
  | "trial"                 // Active trial period
  | "trial_expired"         // Trial ended, grace period
  | "active"               // Paid subscription active
  | "past_due"             // Payment failed, retry period
  | "canceled"             // Subscription cancelled
  | "unpaid"               // Payment failed, access restricted
  | "incomplete"           // Subscription setup incomplete
  | "incomplete_expired"   // Setup expired
  | "paused";              // Subscription paused

export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialStart?: Date;
  trialEnd?: Date;
  pausedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  stripePaymentMethodId: string;
  type: "card" | "bank_account";
  brand?: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  stripeInvoiceId: string;
  amount: number;
  currency: string;
  status: "draft" | "open" | "paid" | "uncollectible" | "void";
  dueDate: Date;
  paidAt?: Date;
  invoiceUrl: string;
  description?: string;
  createdAt: Date;
}

export interface BillingInfo {
  subscription?: Subscription;
  paymentMethods: PaymentMethod[];
  upcomingInvoice?: Invoice;
  invoiceHistory: Invoice[];
  usage: UsageMetrics;
  trialInfo?: TrialInfo;
}

export interface TrialInfo {
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  daysRemaining: number;
  isExpired: boolean;
  gracePeriodEnd?: Date;
  isInGracePeriod: boolean;
}

export interface UsageMetrics {
  teamMembers: number;
  videoUploads: number;
  storageUsed: number; // in bytes
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  limits: {
    maxTeamMembers: number;
    maxVideoUploads: number;
    maxStorageBytes: number;
  };
}

// ===== STRIPE WEBHOOK TYPES =====
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
    previous_attributes?: any;
  };
  created: number;
}

// ===== PLAN MANAGEMENT TYPES =====
export interface PlanChangeRequest {
  newPlanId: string;
  billingCycle: "monthly" | "yearly";
  effectiveDate?: "immediate" | "next_period";
  prorationBehavior?: "create_prorations" | "none";
}

export interface SubscriptionAction {
  type: "upgrade" | "downgrade" | "cancel" | "pause" | "resume";
  planId?: string;
  billingCycle?: "monthly" | "yearly";
  effectiveDate?: Date;
  reason?: string;
}

// ===== TRIAL MANAGEMENT TYPES =====
export interface TrialExtension {
  userId: string;
  additionalDays: number;
  reason: string;
  grantedBy: string;
  grantedAt: Date;
}

export interface TrialStatus {
  isEligible: boolean;
  hasUsedTrial: boolean;
  currentTrialActive: boolean;
  trialEndDate?: Date;
  daysRemaining: number;
  canExtend: boolean;
  maxExtensions: number;
  extensionsUsed: number;
}

// ===== BILLING PORTAL TYPES =====
export interface BillingPortalSession {
  id: string;
  url: string;
  expiresAt: Date;
  returnUrl: string;
}

// ===== CHECKOUT SESSION TYPES =====
export interface CheckoutSession {
  id: string;
  url: string;
  expiresAt: Date;
  planId: string;
  billingCycle: "monthly" | "yearly";
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
}

// ===== SUBSCRIPTION ANALYTICS TYPES =====
export interface SubscriptionAnalytics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  churnRate: number;
  trialConversionRate: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
  activeSubscriptions: number;
  trialUsers: number;
  cancelledSubscriptions: number;
}

// ===== ERROR TYPES =====
export interface SubscriptionError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}

export type SubscriptionErrorCode = 
  | "TRIAL_EXPIRED"
  | "PAYMENT_FAILED"
  | "SUBSCRIPTION_CANCELLED"
  | "PLAN_NOT_FOUND"
  | "STRIPE_ERROR"
  | "INSUFFICIENT_PERMISSIONS"
  | "USAGE_LIMIT_EXCEEDED";