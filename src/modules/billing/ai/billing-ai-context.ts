import { DEFAULT_BILLING_SCOPE } from "@/modules/billing/constants/mock-data";
import { billingService } from "@/modules/billing/services/billing.service";
import {
  formatMoney,
  getBillingSummary,
  getPublicPlans,
  isDowngrade,
  isUpgrade,
} from "@/modules/billing/utils/billing-selectors";
import type { BillingAiContext } from "@/modules/billing/types/billing-platform";

export function buildBillingAiContext(): BillingAiContext {
  const record = billingService.getRecord();

  return {
    ...record.aiContext,
    summary: getBillingSummary(record),
    insights: [
      ...record.aiContext.insights,
      `MRR: ${formatMoney(record.analytics.mrrCents)}`,
      `ARR: ${formatMoney(record.analytics.arrCents)}`,
      `Churn rate: ${(record.analytics.churnRateBps / 100).toFixed(1)}%`,
    ],
    lastGeneratedAt: new Date().toISOString(),
  };
}

export function recommendPlanForAi(): Record<string, unknown> {
  const record = billingService.getRecord();
  const plans = getPublicPlans(billingService.getPlans());
  const currentPlan = record.plan;

  const recommended = plans.find(
    (plan) =>
      plan.planType !== currentPlan.planType &&
      plan.monthlyPriceCents > currentPlan.monthlyPriceCents,
  );

  return {
    currentPlanId: currentPlan.id,
    currentPlanName: currentPlan.name,
    recommendedPlanId: recommended?.id ?? null,
    recommendedPlanName: recommended?.name ?? null,
    reason:
      recommended !== undefined
        ? `Based on usage patterns, ${recommended.name} offers better capacity`
        : "Current plan is optimal for usage",
    mock: true,
  };
}

export function upgradeSubscriptionForAi(input: {
  targetPlanId: string;
  prorate?: boolean;
}): Record<string, unknown> {
  const currentPlan = billingService.getRecord().plan;
  const targetPlan = billingService.getPlanById(input.targetPlanId);

  if (!targetPlan) {
    return { success: false, error: "Plan not found", mock: true };
  }

  if (!isUpgrade(currentPlan, targetPlan)) {
    return { success: false, error: "Target plan is not an upgrade", mock: true };
  }

  const record = billingService.upgradeSubscription({
    subscriptionId: DEFAULT_BILLING_SCOPE.subscriptionId,
    targetPlanId: input.targetPlanId,
    prorate: input.prorate ?? true,
  });

  return {
    success: true,
    planId: record.plan.id,
    planName: record.plan.name,
    mrrCents: record.analytics.mrrCents,
    prorated: input.prorate ?? true,
    mock: true,
  };
}

export function downgradeSubscriptionForAi(input: {
  targetPlanId: string;
  effectiveAt?: "immediate" | "period_end";
}): Record<string, unknown> {
  const currentPlan = billingService.getRecord().plan;
  const targetPlan = billingService.getPlanById(input.targetPlanId);

  if (!targetPlan) {
    return { success: false, error: "Plan not found", mock: true };
  }

  if (!isDowngrade(currentPlan, targetPlan)) {
    return { success: false, error: "Target plan is not a downgrade", mock: true };
  }

  const record = billingService.downgradeSubscription({
    subscriptionId: DEFAULT_BILLING_SCOPE.subscriptionId,
    targetPlanId: input.targetPlanId,
    effectiveAt: input.effectiveAt ?? "period_end",
  });

  return {
    success: true,
    planId: record.plan.id,
    planName: record.plan.name,
    mrrCents: record.analytics.mrrCents,
    effectiveAt: input.effectiveAt ?? "period_end",
    mock: true,
  };
}

export function predictChurnForAi(): Record<string, unknown> {
  const record = billingService.getRecord();

  return {
    churnRiskScore: record.aiContext.churnRiskScore,
    riskLevel:
      record.aiContext.churnRiskScore > 0.7
        ? "high"
        : record.aiContext.churnRiskScore > 0.4
          ? "medium"
          : "low",
    factors: [
      record.analytics.failedPaymentCount > 0 ? "Recent failed payments" : null,
      record.subscription.cancelAtPeriodEnd ? "Scheduled cancellation" : null,
    ].filter(Boolean),
    recommendedActions: record.aiContext.recommendedActions,
    mock: true,
  };
}

export function forecastMrrForAi(input?: { monthsAhead?: number }): Record<string, unknown> {
  const record = billingService.getRecord();
  const monthsAhead = input?.monthsAhead ?? 3;
  const currentMrr = record.analytics.mrrCents;
  const growthRate = 0.05;

  const forecast = Array.from({ length: monthsAhead }, (_, i) => ({
    month: i + 1,
    mrrCents: Math.round(currentMrr * Math.pow(1 + growthRate, i + 1)),
  }));

  return {
    currentMrrCents: currentMrr,
    forecastMrrCents: record.aiContext.mrrForecastCents,
    monthlyForecast: forecast,
    growthRateBps: Math.round(growthRate * 10000),
    mock: true,
  };
}

export function analyzeRevenueForAi(): Record<string, unknown> {
  const record = billingService.getRecord();

  return {
    mrrCents: record.analytics.mrrCents,
    arrCents: record.analytics.arrCents,
    arpuCents: record.analytics.arpuCents,
    activeSubscriptions: record.analytics.activeSubscriptions,
    upgradeCount: record.analytics.upgradeCount,
    downgradeCount: record.analytics.downgradeCount,
    couponRedemptions: record.analytics.couponRedemptionCount,
    summary: getBillingSummary(record),
    mock: true,
  };
}

export function recommendPricingForAi(): Record<string, unknown> {
  const record = billingService.getRecord();

  return {
    currentPlanId: record.plan.id,
    optimizationScore: record.aiContext.pricingOptimizationScore,
    suggestions: [
      "Consider annual billing discount for retention",
      "Professional tier shows highest conversion in segment",
    ],
    recommendedActions: record.aiContext.recommendedActions,
    mock: true,
  };
}

export function detectFailedPaymentsForAi(): Record<string, unknown> {
  const failed = billingService.getFailedPayments();

  return {
    failedCount: failed.length,
    payments: failed.map((p) => ({
      paymentId: p.id,
      invoiceId: p.invoiceId,
      amountCents: p.amountCents,
      failureReason: p.failureReason,
      createdAt: p.createdAt,
    })),
    recommendedActions: [
      "Retry payment with default card",
      "Send dunning notification to account owner",
    ],
    mock: true,
  };
}
