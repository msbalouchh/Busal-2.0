import "server-only";

import { createFinanceRecommendation } from "@/services/ai-finance-recommendation.service";
import { getExpenseSnapshot } from "@/services/ai-finance-expense-analysis.service";
import { getProfitabilitySnapshot } from "@/services/ai-finance-profitability.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export interface CostOptimizationOpportunity {
  area: string;
  description: string;
  estimatedSavingsPence: number;
  action: string;
  confidence: number;
}

export async function identifyCostOptimizations(
  ownerId: string,
): Promise<CostOptimizationOpportunity[]> {
  const [expenses, profitability] = await Promise.all([
    getExpenseSnapshot(ownerId),
    getProfitabilitySnapshot(ownerId),
  ]);

  const opportunities: CostOptimizationOpportunity[] = [];

  if (expenses.topCategory) {
    const top = expenses.byCategory[0];
    if (top && top.totalPence > expenses.totalExpensesPence * 0.4) {
      opportunities.push({
        area: expenses.topCategory,
        description: `${expenses.topCategory} accounts for over 40% of total expenses.`,
        estimatedSavingsPence: Math.round(top.totalPence * 0.1),
        action: `Negotiate vendor contracts and review ${expenses.topCategory} spending.`,
        confidence: 0.8,
      });
    }
  }

  for (const service of profitability.lowMarginServices.slice(0, 2)) {
    opportunities.push({
      area: service.label,
      description: `Service line "${service.label}" is operating at a loss.`,
      estimatedSavingsPence: Math.abs(service.profitPence),
      action: "Reprice, reduce delivery cost, or discontinue unprofitable service.",
      confidence: 0.85,
    });
  }

  return opportunities;
}

export async function generateCostOptimizationRecommendations(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const opportunities = await identifyCostOptimizations(ownerId);
  let created = 0;

  for (const opp of opportunities.slice(0, 5)) {
    await createFinanceRecommendation(businessId, {
      title: `Cost savings: ${opp.area}`,
      description: opp.description,
      action: opp.action,
      expectedImpact: `Estimated savings: £${(opp.estimatedSavingsPence / 100).toFixed(2)}`,
      confidenceScore: opp.confidence,
      metadata: { type: "cost_optimization", area: opp.area },
    });
    created += 1;
  }

  return created;
}
