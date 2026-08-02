import "server-only";

import { getProfitabilityReport, getRevopsDashboard } from "@/services/revops.service";
import { createFinanceInsight } from "@/services/ai-finance-recommendation.service";
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
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getProfitabilitySnapshot(ownerId);
  let created = 0;

  await createFinanceInsight(businessId, {
    title: "Profit margin analysis",
    description: `Net profit: £${(snapshot.netProfitPence / 100).toFixed(2)} (${snapshot.profitMarginPercent}% margin).`,
    category: "profitability",
    priority: snapshot.profitMarginPercent < 10 ? "HIGH" : "MEDIUM",
    recommendation:
      snapshot.profitMarginPercent < 10
        ? "Margins are thin — review pricing and cost structure."
        : "Monitor margin trends monthly to protect profitability.",
    metadata: { profitMarginPercent: snapshot.profitMarginPercent },
  });
  created += 1;

  if (snapshot.lowMarginServices.length > 0) {
    await createFinanceInsight(businessId, {
      title: "Unprofitable services identified",
      description: `${snapshot.lowMarginServices.length} service lines show negative profit.`,
      category: "profitability",
      priority: "HIGH",
      recommendation: snapshot.lowMarginServices.map((s) => s.label).join(", "),
      metadata: { services: snapshot.lowMarginServices.map((s) => s.label) },
    });
    created += 1;
  }

  return created;
}
