export {
  PLAN_TYPES,
  BILLING_CYCLES,
  SUBSCRIPTION_STATUSES,
  BILLING_INVOICE_STATUSES,
  BILLING_PAYMENT_STATUSES,
  TRIAL_STATUSES,
  COUPON_DISCOUNT_TYPES,
  ENTERPRISE_CONTRACT_STATUSES,
  BILLING_AI_TOOL_IDS,
  BILLING_PERMISSIONS,
  PLAN_TYPE_LABELS,
  BILLING_CYCLE_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  type PlanType,
  type BillingCycle,
  type SubscriptionStatus,
  type BillingInvoiceStatus,
  type BillingPaymentStatus,
  type TrialStatus,
  type CouponDiscountType,
  type EnterpriseContractStatus,
  type BillingAiToolId,
  type BillingPermission,
} from "@/modules/billing/constants/billing-status";

export {
  BILLING_MODULE_KEYS,
  BILLING_AI_FEATURE_KEYS,
  FEATURE_LIMIT_KEYS,
  FEATURE_LIMIT_LABELS,
  UNLIMITED_LIMIT,
  type BillingModuleKey,
  type BillingAiFeatureKey,
  type FeatureLimitKey,
} from "@/modules/billing/constants/feature-access";

export {
  BILLING_INTEGRATION_POINTS,
  type BillingIntegrationPoint,
} from "@/modules/billing/constants/integration-points";

export {
  BILLING_PLATFORM_ROUTES,
  BILLING_PLATFORM_NAV_ITEMS,
} from "@/modules/billing/constants/platform-routes";

export {
  DEFAULT_BILLING_SCOPE,
  MOCK_SUBSCRIPTION_PLANS,
  FREE_ACCESS,
  STARTER_ACCESS,
  PROFESSIONAL_ACCESS,
  BUSINESS_ACCESS,
  ENTERPRISE_ACCESS,
} from "@/modules/billing/constants/mock-data";

export type * from "@/modules/billing/types/billing-platform";

export * from "@/modules/billing/utils/billing-selectors";
export * from "@/modules/billing/utils/feature-access-utils";
export * from "@/modules/billing/utils/billing-proration-utils";

export {
  BillingRepository,
  billingRepository,
} from "@/modules/billing/repository/billing-repository";

export { BillingService, billingService } from "@/modules/billing/services/billing.service";

export {
  FeatureAccessService,
  createFeatureAccessService,
} from "@/modules/billing/services/feature-access.service";

export {
  buildBillingPlatformContext,
  buildBillingPlatformSnapshot,
  getDefaultBillingSnapshot,
  getBillingPlatformSummary,
  type BillingPlatformSnapshot,
  type BillingPlatformInput,
} from "@/modules/billing/services/billing-platform.service";

export { BillingProvider } from "@/modules/billing/providers/billing-provider";
export { BillingContext } from "@/modules/billing/contexts/billing-context";

export { useBilling, useBillingContext } from "@/modules/billing/hooks/use-billing";
export { useFeatureAccess } from "@/modules/billing/hooks/use-feature-access";
export { useBillingUsage } from "@/modules/billing/hooks/use-billing-usage";

export { PlanTypeBadge } from "@/modules/billing/components/plan-type-badge";
export { SubscriptionStatusBadge } from "@/modules/billing/components/subscription-status-badge";
export { BillingCycleBadge } from "@/modules/billing/components/billing-cycle-badge";

export {
  registerBillingAiTools,
  BILLING_AI_TOOLS,
  buildBillingAiContext,
  recommendPlanForAi,
  upgradeSubscriptionForAi,
  downgradeSubscriptionForAi,
  predictChurnForAi,
  forecastMrrForAi,
  analyzeRevenueForAi,
  recommendPricingForAi,
  detectFailedPaymentsForAi,
} from "@/modules/billing/ai";
