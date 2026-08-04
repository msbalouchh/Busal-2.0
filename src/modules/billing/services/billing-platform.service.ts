import { DEFAULT_BILLING_SCOPE } from "@/modules/billing/constants/mock-data";
import { billingRepository } from "@/modules/billing/repository/billing-repository";
import { createFeatureAccessService } from "@/modules/billing/services/feature-access.service";
import type {
  BillingPlatformContext,
  BillingRecord,
  PlanFeatureAccess,
} from "@/modules/billing/types/billing-platform";
import { getBillingSummary, getMrrCents } from "@/modules/billing/utils/billing-selectors";

export interface BillingPlatformSnapshot {
  context: BillingPlatformContext;
  record: BillingRecord;
  featureAccess: PlanFeatureAccess;
  mrrCents: number;
  arrCents: number;
  openInvoiceCount: number;
  failedPaymentCount: number;
  activeSubscriptionCount: number;
  trialActive: boolean;
  usagePercentages: Record<string, number>;
}

export interface BillingPlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId?: string;
  userId?: string;
  subscriptionId?: string;
  planId?: string;
  baseCurrency?: string;
}

export function buildBillingPlatformContext(
  input: BillingPlatformInput = {},
): BillingPlatformContext {
  return {
    tenantId: input.tenantId ?? DEFAULT_BILLING_SCOPE.tenantId,
    workspaceId: input.workspaceId ?? DEFAULT_BILLING_SCOPE.workspaceId,
    businessId: input.businessId ?? DEFAULT_BILLING_SCOPE.businessId,
    userId: input.userId ?? DEFAULT_BILLING_SCOPE.userId,
    subscriptionId: input.subscriptionId ?? DEFAULT_BILLING_SCOPE.subscriptionId,
    planId: input.planId ?? DEFAULT_BILLING_SCOPE.planId,
    baseCurrency: input.baseCurrency ?? DEFAULT_BILLING_SCOPE.baseCurrency,
  };
}

export function buildBillingPlatformSnapshot(
  input: BillingPlatformInput = {},
): BillingPlatformSnapshot {
  const context = buildBillingPlatformContext(input);
  const record = billingRepository.getRecord();
  const featureAccess = record.workspaceSubscription.featureAccess;
  const accessService = createFeatureAccessService(featureAccess);
  const usageSummary = accessService.getUsageSummary(record.usageRecords);

  const usagePercentages: Record<string, number> = {};
  for (const item of usageSummary) {
    if (item.isUnlimited) {
      usagePercentages[item.limitKey] = 0;
    } else if (item.limit > 0) {
      usagePercentages[item.limitKey] = Math.round((item.current / item.limit) * 100);
    } else {
      usagePercentages[item.limitKey] = 100;
    }
  }

  return {
    context,
    record,
    featureAccess,
    mrrCents: getMrrCents(record),
    arrCents: record.analytics.arrCents,
    openInvoiceCount: billingRepository.getOpenInvoices().length,
    failedPaymentCount: billingRepository.getFailedPayments().length,
    activeSubscriptionCount: record.analytics.activeSubscriptions,
    trialActive: record.trial?.status === "active",
    usagePercentages,
  };
}

export function getDefaultBillingSnapshot(): BillingPlatformSnapshot {
  return buildBillingPlatformSnapshot();
}

export function getBillingPlatformSummary(input: BillingPlatformInput = {}): string {
  const snapshot = buildBillingPlatformSnapshot(input);
  return getBillingSummary(snapshot.record);
}
