import type {
  BillingAiFeatureKey,
  BillingModuleKey,
  FeatureLimitKey,
} from "@/modules/billing/constants/feature-access";
import type {
  BillingCycle,
  BillingInvoiceStatus,
  BillingPaymentStatus,
  CouponDiscountType,
  EnterpriseContractStatus,
  PlanType,
  SubscriptionStatus,
  TrialStatus,
} from "@/modules/billing/constants/billing-status";

/** Canonical feature limits for a plan — controls Busal OS access. */
export interface FeatureLimits {
  maxStaff: number;
  maxBranches: number;
  maxMenuItems: number;
  maxTables: number;
  maxReservations: number;
  maxOrders: number;
  maxStorageMb: number;
  maxAiCredits: number;
  maxApiCalls: number;
  maxIntegrations: number;
}

/** Complete feature access definition for a subscription plan. */
export interface PlanFeatureAccess {
  enabledModules: BillingModuleKey[];
  enabledAiFeatures: BillingAiFeatureKey[];
  limits: FeatureLimits;
  customLimits: Partial<Record<string, number>>;
}

/** Subscription plan definition. */
export interface SubscriptionPlan {
  id: string;
  slug: string;
  name: string;
  planType: PlanType;
  description: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  currency: string;
  featureAccess: PlanFeatureAccess;
  isPublic: boolean;
  isActive: boolean;
  trialDays: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** Individual plan feature flag. */
export interface PlanFeature {
  id: string;
  planId: string;
  featureKey: string;
  label: string;
  isEnabled: boolean;
  moduleKey: BillingModuleKey | null;
}

/** Named limit on a plan. */
export interface FeatureLimit {
  id: string;
  planId: string;
  limitKey: FeatureLimitKey | string;
  limitValue: number;
  isUnlimited: boolean;
}

/** Usage meter definition. */
export interface UsageMeter {
  id: string;
  planId: string;
  meterKey: string;
  label: string;
  unit: string;
  resetInterval: BillingCycle;
}

/** Active subscription (generic). */
export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  pausedAt: string | null;
  trialEnd: string | null;
  quantity: number;
  currency: string;
  mrrCents: number;
  createdAt: string;
  updatedAt: string;
}

/** Workspace-level subscription binding. */
export interface WorkspaceSubscription {
  id: string;
  tenantId: string;
  workspaceId: string;
  subscriptionId: string;
  planId: string;
  status: SubscriptionStatus;
  featureAccess: PlanFeatureAccess;
  effectiveFrom: string;
  effectiveTo: string | null;
}

/** Business-level subscription binding. */
export interface BusinessSubscription {
  id: string;
  tenantId: string;
  workspaceId: string;
  businessId: string;
  subscriptionId: string;
  planId: string;
  status: SubscriptionStatus;
  branchCount: number;
  staffCount: number;
  featureAccess: PlanFeatureAccess;
}

/** Billing cycle period record. */
export interface BillingCycleRecord {
  id: string;
  subscriptionId: string;
  cycle: BillingCycle;
  periodStart: string;
  periodEnd: string;
  amountCents: number;
  currency: string;
  isPaid: boolean;
}

/** SaaS billing invoice. */
export interface BillingInvoice {
  id: string;
  tenantId: string;
  workspaceId: string;
  subscriptionId: string;
  invoiceNumber: string;
  status: BillingInvoiceStatus;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  amountPaidCents: number;
  amountDueCents: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  paidAt: string | null;
  lineItems: InvoiceLine[];
  createdAt: string;
}

/** Invoice line item. */
export interface InvoiceLine {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitAmountCents: number;
  amountCents: number;
  periodStart: string | null;
  periodEnd: string | null;
}

/** Subscription payment. */
export interface BillingPayment {
  id: string;
  tenantId: string;
  invoiceId: string;
  paymentMethodId: string;
  amountCents: number;
  currency: string;
  status: BillingPaymentStatus;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
}

/** Stored payment method (no Stripe — architecture only). */
export interface PaymentMethod {
  id: string;
  tenantId: string;
  type: "card" | "bank_account" | "invoice";
  label: string;
  last4: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  isDefault: boolean;
  isActive: boolean;
}

/** Billing refund. */
export interface BillingRefund {
  id: string;
  tenantId: string;
  paymentId: string;
  invoiceId: string;
  amountCents: number;
  currency: string;
  reason: string;
  refundedAt: string;
}

/** Discount coupon. */
export interface Coupon {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  valueBps: number | null;
  amountCents: number | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
}

/** Promotional campaign. */
export interface Promotion {
  id: string;
  name: string;
  couponId: string;
  planIds: string[];
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
}

/** Applied discount on subscription/invoice. */
export interface Discount {
  id: string;
  subscriptionId: string;
  couponId: string;
  couponCode: string;
  amountCents: number;
  appliedAt: string;
  expiresAt: string | null;
}

/** Free trial period. */
export interface Trial {
  id: string;
  tenantId: string;
  workspaceId: string;
  planId: string;
  status: TrialStatus;
  startedAt: string;
  endsAt: string;
  convertedAt: string | null;
  daysRemaining: number;
}

/** Tax on billing invoice. */
export interface BillingTax {
  id: string;
  invoiceId: string;
  taxName: string;
  rateBps: number;
  taxableAmountCents: number;
  taxAmountCents: number;
  jurisdiction: string;
}

/** Metered usage record. */
export interface UsageRecord {
  id: string;
  tenantId: string;
  workspaceId: string;
  meterKey: string;
  quantity: number;
  recordedAt: string;
  periodStart: string;
  periodEnd: string;
}

/** Enterprise contract for custom billing. */
export interface EnterpriseContract {
  id: string;
  tenantId: string;
  workspaceId: string;
  contractNumber: string;
  status: EnterpriseContractStatus;
  planId: string;
  customPlanId: string | null;
  startDate: string;
  endDate: string;
  mrrCents: number;
  currency: string;
  featureAccess: PlanFeatureAccess;
  signedAt: string | null;
  renewalDate: string;
  accountManagerName: string | null;
}

/** Custom enterprise plan override. */
export interface CustomPlan {
  id: string;
  tenantId: string;
  name: string;
  planType: "custom";
  basePlanId: string;
  featureAccess: PlanFeatureAccess;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  currency: string;
  notes: string | null;
  approvedByUserId: string | null;
  createdAt: string;
}

/** Billing performance metrics. */
export interface BillingAnalytics {
  tenantId: string;
  mrrCents: number;
  arrCents: number;
  activeSubscriptions: number;
  trialingCount: number;
  churnRateBps: number;
  arpuCents: number;
  failedPaymentCount: number;
  couponRedemptionCount: number;
  upgradeCount: number;
  downgradeCount: number;
}

/** AI-enriched billing context. */
export interface BillingAiContext {
  tenantId: string;
  summary: string;
  churnRiskScore: number;
  mrrForecastCents: number;
  recommendedPlanId: string | null;
  pricingOptimizationScore: number;
  insights: string[];
  recommendedActions: string[];
  lastGeneratedAt: string;
}

/** Full billing aggregate — single source of truth. */
export interface BillingRecord {
  plan: SubscriptionPlan;
  subscription: Subscription;
  workspaceSubscription: WorkspaceSubscription;
  businessSubscriptions: BusinessSubscription[];
  billingCycles: BillingCycleRecord[];
  invoices: BillingInvoice[];
  payments: BillingPayment[];
  paymentMethods: PaymentMethod[];
  refunds: BillingRefund[];
  coupons: Coupon[];
  promotions: Promotion[];
  discounts: Discount[];
  trial: Trial | null;
  taxes: BillingTax[];
  usageRecords: UsageRecord[];
  enterpriseContract: EnterpriseContract | null;
  customPlan: CustomPlan | null;
  analytics: BillingAnalytics;
  aiContext: BillingAiContext;
}

export interface BillingSearchQuery {
  query?: string;
  tenantId?: string;
  workspaceId?: string;
  planType?: PlanType;
  status?: SubscriptionStatus;
  limit?: number;
}

export interface UpgradeSubscriptionInput {
  subscriptionId: string;
  targetPlanId: string;
  prorate?: boolean;
}

export interface DowngradeSubscriptionInput {
  subscriptionId: string;
  targetPlanId: string;
  effectiveAt?: "immediate" | "period_end";
}

export interface ApplyCouponInput {
  subscriptionId: string;
  couponCode: string;
}

export interface BillingPlatformContext {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  userId: string;
  subscriptionId: string;
  planId: string;
  baseCurrency: string;
}

export interface BillingContextValue {
  context: BillingPlatformContext;
  record: BillingRecord;
  plans: SubscriptionPlan[];
  featureAccess: PlanFeatureAccess;
  selectedPlanId: string | null;
  selectPlan: (planId: string | null) => void;
  refresh: () => void;
}

export interface FeatureAccessContextValue {
  featureAccess: PlanFeatureAccess;
  isModuleEnabled: (moduleKey: BillingModuleKey) => boolean;
  isAiFeatureEnabled: (featureKey: BillingAiFeatureKey) => boolean;
  getLimit: (limitKey: FeatureLimitKey) => number;
  isWithinLimit: (limitKey: FeatureLimitKey, currentUsage: number) => boolean;
  refresh: () => void;
}

export interface BillingUsageContextValue {
  usageRecords: UsageRecord[];
  limits: FeatureLimits;
  refresh: () => void;
}
