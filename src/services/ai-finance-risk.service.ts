import "server-only";

import {
  createFinanceInsight,
  createFinanceRecommendation,
} from "@/services/ai-finance-recommendation.service";
import {
  runOwnerDomainDetectionTask,
  runOwnerDomainInsightTask,
} from "@/services/ai-domain-insight-runner.service";
import { getCashFlowSnapshot } from "@/services/ai-finance-cash-flow.service";
import { getProfitabilitySnapshot } from "@/services/ai-finance-profitability.service";
import { getExpenseSnapshot } from "@/services/ai-finance-expense-analysis.service";

export interface FinancialRiskAlert {
  id: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category: string;
  recommendation: string;
}

export async function detectFinancialRisks(ownerId: string): Promise<FinancialRiskAlert[]> {
  return runOwnerDomainDetectionTask<FinancialRiskAlert>(ownerId, {
    module: "finance",
    task: "financial-risk-detection",
    responseKey: "alerts",
    loadContext: async (id) => {
      const [cashFlow, profitability, expenses] = await Promise.all([
        getCashFlowSnapshot(id),
        getProfitabilitySnapshot(id),
        getExpenseSnapshot(id),
      ]);
      return { cashFlow, profitability, expenses };
    },
  });
}

export async function generateFinancialRiskInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "finance",
    task: "financial-risk-insights",
    loadContext: async (ownerId) => ({ ownerId }),
    persistInsight: (businessId, insight) =>
      createFinanceInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "risk",
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
