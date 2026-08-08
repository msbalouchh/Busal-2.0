import "server-only";

import { getProfitabilityReport, getRevopsDashboard } from "@/services/revops.service";
import { createFinanceInsight } from "@/services/ai-finance-recommendation.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export interface ProfitabilitySnapshot {
  netProfitPence: number;
  profitMarginPercent: number;
  totalCollectedPence: number;
  totalExpensesPence: number;
  topProfitableCustomers: Array<{ label: string; profitPence: number }>;
  lowMarginServices: Array<{ label: string; profitPence: number }>;
}

export async function getProfitabilitySnapshot(ownerId: string): Promise<ProfitabilitySnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);
  const [revops, profitability] = await Promise.all([
    getRevopsDashboard(businessId),
    getProfitabilityReport(businessId),
  ]);

  const profitMarginPercent =
    revops.totalCollectedPence > 0
      ? Math.round((revops.netProfitPence / revops.totalCollectedPence) * 100)
      : 0;

  return {
    netProfitPence: revops.netProfitPence,
    profitMarginPercent,
    totalCollectedPence: revops.totalCollectedPence,
    totalExpensesPence: revops.totalExpensesPence,
    topProfitableCustomers: profitability.byCustomer
      .filter((c) => c.profitPence > 0)
      .sort((a, b) => b.profitPence - a.profitPence)
      .slice(0, 5)
      .map((c) => ({ label: c.label, profitPence: c.profitPence })),
    lowMarginServices: profitability.byService
      .filter((s) => s.profitPence < 0)
      .slice(0, 5)
      .map((s) => ({ label: s.label, profitPence: s.profitPence })),
  };
}

export async function generateProfitabilityInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "finance",
    task: "profitability-insights",
    loadContext: getProfitabilitySnapshot,
    persistInsight: (businessId, insight) =>
      createFinanceInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "profitability",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
  });
}
