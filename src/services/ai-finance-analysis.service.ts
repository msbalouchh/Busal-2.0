import "server-only";

/** Orchestrates domain AI inference via delegated services. */


import { prisma } from "@/lib/prisma";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { generateRevenueInsights } from "@/services/ai-finance-revenue-analysis.service";
import { generateExpenseInsights } from "@/services/ai-finance-expense-analysis.service";
import { generateProfitabilityInsights } from "@/services/ai-finance-profitability.service";
import {
  generateCashFlowInsights,
  generatePaymentInsights,
} from "@/services/ai-finance-cash-flow.service";
import { generateBudgetInsights } from "@/services/ai-finance-budget-analysis.service";
import { generateForecastInsights } from "@/services/ai-finance-forecast.service";
import { generateCostOptimizationRecommendations } from "@/services/ai-finance-cost-optimization.service";
import { generateBusinessHealthInsights } from "@/services/ai-finance-business-health.service";
import { generateFinancialRiskInsights } from "@/services/ai-finance-risk.service";
import {
  listFinanceInsights,
  listFinanceRecommendations,
} from "@/services/ai-finance-recommendation.service";
import { getBusinessHealthSnapshot } from "@/services/ai-finance-business-health.service";
import { getRevenueSnapshot } from "@/services/ai-finance-revenue-analysis.service";
import { getCashFlowSnapshot } from "@/services/ai-finance-cash-flow.service";
import { detectFinancialRisks } from "@/services/ai-finance-risk.service";

export interface FinanceAgentDashboardStats {
  totalInsights: number;
  activeInsights: number;
  totalRecommendations: number;
  newRecommendations: number;
  healthScore: number;
  healthLabel: string;
  netCashFlowPence: number;
  profitMarginPercent: number;
  overdueInvoices: number;
  riskCount: number;
}

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export async function getFinanceAgentDashboardStats(
  ownerId: string,
): Promise<FinanceAgentDashboardStats> {
  const businessId = await getOwnedBusinessId(ownerId);

  const [insightCounts, recommendationCounts, health, cashFlow, risks] = await Promise.all([
    prisma.aIFinanceInsight.groupBy({
      by: ["status"],
      where: { businessId },
      _count: { _all: true },
    }),
    prisma.aIFinanceRecommendation.groupBy({
      by: ["status"],
      where: { businessId },
      _count: { _all: true },
    }),
    getBusinessHealthSnapshot(ownerId),
    getCashFlowSnapshot(ownerId),
    detectFinancialRisks(ownerId),
  ]);

  const totalInsights = insightCounts.reduce((sum, row) => sum + row._count._all, 0);
  const activeInsights = insightCounts.find((row) => row.status === "ACTIVE")?._count._all ?? 0;
  const totalRecommendations = recommendationCounts.reduce((sum, row) => sum + row._count._all, 0);
  const newRecommendations =
    recommendationCounts.find((row) => row.status === "NEW")?._count._all ?? 0;

  return {
    totalInsights,
    activeInsights,
    totalRecommendations,
    newRecommendations,
    healthScore: health.healthScore,
    healthLabel: health.healthLabel,
    netCashFlowPence: cashFlow.netCashFlowPence,
    profitMarginPercent: health.profitMarginPercent,
    overdueInvoices: cashFlow.overdueInvoices,
    riskCount: risks.length,
  };
}

export async function runFinanceAnalysis(
  ownerId: string,
): Promise<{ insightsCreated: number; recommendationsCreated: number }> {
  const results = await Promise.all([
    generateRevenueInsights(ownerId),
    generateExpenseInsights(ownerId),
    generateProfitabilityInsights(ownerId),
    generateCashFlowInsights(ownerId),
    generatePaymentInsights(ownerId),
    generateBudgetInsights(ownerId),
    generateForecastInsights(ownerId),
    generateBusinessHealthInsights(ownerId),
    generateFinancialRiskInsights(ownerId),
    generateCostOptimizationRecommendations(ownerId),
  ]);

  const insightResults = results.slice(0, 9);
  const recommendationResults = results.slice(9);

  return {
    insightsCreated: insightResults.reduce((sum, n) => sum + n, 0),
    recommendationsCreated: recommendationResults.reduce((sum, n) => sum + n, 0),
  };
}

export async function getFinanceAnalysisSummary(ownerId: string) {
  const [stats, insights, recommendations, revenue, cashFlow, health, risks] = await Promise.all([
    getFinanceAgentDashboardStats(ownerId),
    listFinanceInsights(ownerId, { pageSize: 5, status: "ACTIVE" }),
    listFinanceRecommendations(ownerId, { pageSize: 5, status: "NEW" }),
    getRevenueSnapshot(ownerId),
    getCashFlowSnapshot(ownerId),
    getBusinessHealthSnapshot(ownerId),
    detectFinancialRisks(ownerId),
  ]);

  return { stats, insights, recommendations, revenue, cashFlow, health, risks };
}
