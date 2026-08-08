import "server-only";

import { createFinanceInsight } from "@/services/ai-finance-recommendation.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";
import { getCashFlowSnapshot } from "@/services/ai-finance-cash-flow.service";
import { getProfitabilitySnapshot } from "@/services/ai-finance-profitability.service";
import { getRevenueSnapshot } from "@/services/ai-finance-revenue-analysis.service";
import { getBudgetSnapshot } from "@/services/ai-finance-budget-analysis.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export interface BusinessHealthSnapshot {
  healthScore: number;
  healthLabel: string;
  profitMarginPercent: number;
  netCashFlowPence: number;
  revenueGrowthIndicator: number;
  budgetStatus: string;
  riskCount: number;
}

export function computeBusinessHealthScore(input: {
  profitMarginPercent: number;
  netCashFlowPence: number;
  overdueInvoices: number;
  budgetStatus: string;
  revenueGrowthIndicator: number;
}): { score: number; label: string } {
  let score = 50;
  score += Math.min(25, input.profitMarginPercent);
  score += input.netCashFlowPence > 0 ? 15 : -20;
  score -= input.overdueInvoices * 5;
  score += input.revenueGrowthIndicator > 0 ? 10 : -5;
  if (input.budgetStatus === "OVER_BUDGET") score -= 15;
  if (input.budgetStatus === "ON_TRACK") score += 5;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const label =
    score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs attention";

  return { score, label };
}

export async function getBusinessHealthSnapshot(ownerId: string): Promise<BusinessHealthSnapshot> {
  const [profitability, cashFlow, revenue, budget] = await Promise.all([
    getProfitabilitySnapshot(ownerId),
    getCashFlowSnapshot(ownerId),
    getRevenueSnapshot(ownerId),
    getBudgetSnapshot(ownerId),
  ]);

  const revenueGrowthIndicator =
    revenue.revenueWeekPence > 0
      ? Math.round(
          ((revenue.revenueTodayPence * 7 - revenue.revenueWeekPence) / revenue.revenueWeekPence) *
            100,
        )
      : 0;

  const health = computeBusinessHealthScore({
    profitMarginPercent: profitability.profitMarginPercent,
    netCashFlowPence: cashFlow.netCashFlowPence,
    overdueInvoices: cashFlow.overdueInvoices,
    budgetStatus: budget.budgetStatus,
    revenueGrowthIndicator,
  });

  const riskCount =
    (cashFlow.overdueInvoices > 0 ? 1 : 0) +
    (cashFlow.netCashFlowPence < 0 ? 1 : 0) +
    (profitability.profitMarginPercent < 10 ? 1 : 0) +
    (budget.budgetStatus === "OVER_BUDGET" ? 1 : 0);

  return {
    healthScore: health.score,
    healthLabel: health.label,
    profitMarginPercent: profitability.profitMarginPercent,
    netCashFlowPence: cashFlow.netCashFlowPence,
    revenueGrowthIndicator,
    budgetStatus: budget.budgetStatus,
    riskCount,
  };
}

export async function generateBusinessHealthInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "finance",
    task: "business-health-insights",
    loadContext: getBusinessHealthSnapshot,
    persistInsight: (businessId, insight) =>
      createFinanceInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "health",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
  });
}
