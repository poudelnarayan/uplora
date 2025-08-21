// Subscription Type Definitions for Stripe Integration

export interface User {
  id: string;
  email: string;
  name?: string;
  stripeCustomerId?: string;
  subscriptionStatus: SubscriptionStatus;
  trialStartDate?: Date;
  trialEndDate?: Date;
  currentPlanId?: string;
}

export type SubscriptionStatus = 
  | "trial" 
  | "active" 
  | "past_due" 
  | "canceled" 
  | "unpaid" 
  | "incomplete" 
  | "incomplete_expired"
  | "trialing";

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
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  type: "card" | "bank_account";
  brand?: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
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
  createdAt: Date;
}

export interface BillingInfo {
  subscription?: Subscription;
  paymentMethods: PaymentMethod[];
  upcomingInvoice?: Invoice;
  invoiceHistory: Invoice[];
  usage: UsageMetrics;
}

export interface UsageMetrics {
  teamMembers: number;
  videoUploads: number;
  storageUsed: number; // in bytes
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

// Stripe Webhook Event Types
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
    previous_attributes?: any;
  };
  created: number;
}

// Plan Change Request
export interface PlanChangeRequest {
  newPlanId: string;
  billingCycle: "monthly" | "yearly";
  effectiveDate?: "immediate" | "next_period";
}