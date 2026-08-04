/** SaaS subscription plan tiers. */
export const PLAN_TYPES = {
  FREE: "free",
  STARTER: "starter",
  PROFESSIONAL: "professional",
  BUSINESS: "business",
  ENTERPRISE: "enterprise",
  CUSTOM: "custom",
} as const;

export type PlanType = (typeof PLAN_TYPES)[keyof typeof PLAN_TYPES];

/** Billing cycle intervals. */
export const BILLING_CYCLES = {
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  YEARLY: "yearly",
  CUSTOM: "custom",
} as const;

export type BillingCycle = (typeof BILLING_CYCLES)[keyof typeof BILLING_CYCLES];

/** Subscription lifecycle statuses. */
export const SUBSCRIPTION_STATUSES = {
  TRIALING: "trialing",
  ACTIVE: "active",
  PAST_DUE: "past_due",
  PAUSED: "paused",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
} as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[keyof typeof SUBSCRIPTION_STATUSES];

/** Billing invoice statuses. */
export const BILLING_INVOICE_STATUSES = {
  DRAFT: "draft",
  OPEN: "open",
  PAID: "paid",
  VOID: "void",
  UNCOLLECTIBLE: "uncollectible",
} as const;

export type BillingInvoiceStatus =
  (typeof BILLING_INVOICE_STATUSES)[keyof typeof BILLING_INVOICE_STATUSES];

/** Payment statuses. */
export const BILLING_PAYMENT_STATUSES = {
  PENDING: "pending",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export type BillingPaymentStatus =
  (typeof BILLING_PAYMENT_STATUSES)[keyof typeof BILLING_PAYMENT_STATUSES];

/** Trial statuses. */
export const TRIAL_STATUSES = {
  ACTIVE: "active",
  EXPIRED: "expired",
  CONVERTED: "converted",
  CANCELLED: "cancelled",
} as const;

export type TrialStatus = (typeof TRIAL_STATUSES)[keyof typeof TRIAL_STATUSES];

/** Coupon discount types. */
export const COUPON_DISCOUNT_TYPES = {
  PERCENTAGE: "percentage",
  FIXED: "fixed",
} as const;

export type CouponDiscountType = (typeof COUPON_DISCOUNT_TYPES)[keyof typeof COUPON_DISCOUNT_TYPES];

/** Enterprise contract statuses. */
export const ENTERPRISE_CONTRACT_STATUSES = {
  DRAFT: "draft",
  ACTIVE: "active",
  RENEWING: "renewing",
  EXPIRED: "expired",
  TERMINATED: "terminated",
} as const;

export type EnterpriseContractStatus =
  (typeof ENTERPRISE_CONTRACT_STATUSES)[keyof typeof ENTERPRISE_CONTRACT_STATUSES];

export const BILLING_AI_TOOL_IDS = {
  RECOMMEND_PLAN: "billing.recommend-plan",
  UPGRADE_SUBSCRIPTION: "billing.upgrade-subscription",
  DOWNGRADE_SUBSCRIPTION: "billing.downgrade-subscription",
  PREDICT_CHURN: "billing.predict-churn",
  FORECAST_MRR: "billing.forecast-mrr",
  ANALYZE_REVENUE: "billing.analyze-revenue",
  RECOMMEND_PRICING: "billing.recommend-pricing",
  DETECT_FAILED_PAYMENTS: "billing.detect-failed-payments",
} as const;

export type BillingAiToolId = (typeof BILLING_AI_TOOL_IDS)[keyof typeof BILLING_AI_TOOL_IDS];

/** Module-local permission markers (future RBAC wiring). */
export const BILLING_PERMISSIONS = {
  READ: "billing.read",
  MANAGE: "billing.manage",
  SUBSCRIBE: "billing.subscribe",
  INVOICE: "billing.invoice",
  COUPON: "billing.coupon",
  ENTERPRISE: "billing.enterprise",
  ANALYTICS_READ: "billing.analytics.read",
} as const;

export type BillingPermission = (typeof BILLING_PERMISSIONS)[keyof typeof BILLING_PERMISSIONS];

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  free: "Free",
  starter: "Starter",
  professional: "Professional",
  business: "Business",
  enterprise: "Enterprise",
  custom: "Custom",
};

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
  custom: "Custom",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trialing: "Trialing",
  active: "Active",
  past_due: "Past Due",
  paused: "Paused",
  cancelled: "Cancelled",
  expired: "Expired",
};
