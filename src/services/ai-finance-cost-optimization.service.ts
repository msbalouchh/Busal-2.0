import "server-only";

import {
  createFinanceInsight,
  createFinanceRecommendation,
} from "@/services/ai-finance-recommendation.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";
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
  return runOwnerDomainInsightTask(ownerId, {
    module: "finance",
    task: "cost-optimization-recommendations",
    loadContext: async (ownerId) => ({ ownerId }),
    persistInsight: (businessId, insight) =>
      createFinanceInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "cost_optimization",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
    persistRecommendation: (businessId, recommendation) =>
      createFinanceRecommendation(businessId, {
        title: recommendation.title,
        description: recommendation.description,
        action: recommendation.action ?? recommendation.recommendation ?? "Review AI recommendation",
        expectedImpact: recommendation.expectedImpact,
        confidenceScore: recommendation.confidenceScore,
        metadata: recommendation.metadata,
      }),
  });
}
