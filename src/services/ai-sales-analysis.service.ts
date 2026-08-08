import "server-only";

/** Orchestrates domain AI inference via delegated services. */


import { prisma } from "@/lib/prisma";
import { getCustomerAnalytics } from "@/services/reporting.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { getPipelineAnalysisSnapshot } from "@/services/ai-sales-pipeline-analysis.service";
import { getRevenueInsightSnapshot } from "@/services/ai-sales-revenue-insight.service";
import { detectSalesOpportunities } from "@/services/ai-sales-opportunity-detection.service";
import { generatePipelineInsights } from "@/services/ai-sales-pipeline-analysis.service";
import { generateQuoteInsights } from "@/services/ai-sales-quote-analysis.service";
import { generateRevenueInsights } from "@/services/ai-sales-revenue-insight.service";
import { generateOpportunityRecommendations } from "@/services/ai-sales-opportunity-detection.service";
import {
  listSalesInsights,
  listSalesRecommendations,
} from "@/services/ai-sales-recommendation.service";

export interface SalesAgentDashboardStats {
  totalInsights: number;
  activeInsights: number;
  totalRecommendations: number;
  newRecommendations: number;
  healthScore: number;
  healthLabel: string;
  revenueTodayPence: number;
  openPipelineValuePence: number;
  openOpportunities: number;
}

export interface SalesHealthBreakdown {
  score: number;
  label: string;
  factors: Array<{ name: string; score: number; weight: number }>;
}

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export function computeSalesHealthScore(input: {
  hasRevenue: boolean;
  openLeads: number;
  openPipelineValuePence: number;
  pendingTasks: number;
  newRecommendations: number;
  retentionRatePercent: number;
}): SalesHealthBreakdown {
  const factors = [
    { name: "Revenue activity", score: input.hasRevenue ? 90 : 30, weight: 0.3 },
    {
      name: "Pipeline strength",
      score: Math.min(100, input.openPipelineValuePence / 10000),
      weight: 0.25,
    },
    { name: "Lead flow", score: Math.min(100, input.openLeads * 15), weight: 0.15 },
    {
      name: "Task completion",
      score: input.pendingTasks === 0 ? 100 : Math.max(20, 100 - input.pendingTasks * 10),
      weight: 0.15,
    },
    { name: "Customer retention", score: input.retentionRatePercent, weight: 0.15 },
  ];

  const score = Math.round(factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0));

  const label =
    score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs attention";

  return { score, label, factors };
}

export async function getSalesAgentDashboardStats(
  ownerId: string,
): Promise<SalesAgentDashboardStats> {
  const businessId = await getOwnedBusinessId(ownerId);

  const [insightCounts, recommendationCounts, revenue, pipeline, customerAnalytics] =
    await Promise.all([
      prisma.aISalesInsight.groupBy({
        by: ["status"],
        where: { businessId },
        _count: { _all: true },
      }),
      prisma.aISalesRecommendation.groupBy({
        by: ["status"],
        where: { businessId },
        _count: { _all: true },
      }),
      getRevenueInsightSnapshot(ownerId),
      getPipelineAnalysisSnapshot(ownerId),
      getCustomerAnalytics(businessId),
    ]);

  const totalInsights = insightCounts.reduce((sum, row) => sum + row._count._all, 0);
  const activeInsights = insightCounts.find((row) => row.status === "ACTIVE")?._count._all ?? 0;
  const totalRecommendations = recommendationCounts.reduce((sum, row) => sum + row._count._all, 0);
  const newRecommendations =
    recommendationCounts.find((row) => row.status === "NEW")?._count._all ?? 0;

  const health = computeSalesHealthScore({
    hasRevenue: revenue.totalOrders > 0,
    openLeads: pipeline.openLeads,
    openPipelineValuePence: pipeline.openOpportunityValuePence,
    pendingTasks: pipeline.pendingTasks,
    newRecommendations,
    retentionRatePercent: customerAnalytics.retentionRatePercent,
  });

  return {
    totalInsights,
    activeInsights,
    totalRecommendations,
    newRecommendations,
    healthScore: health.score,
    healthLabel: health.label,
    revenueTodayPence: revenue.grossRevenuePence,
    openPipelineValuePence: pipeline.openOpportunityValuePence,
    openOpportunities: pipeline.totalOpportunities,
  };
}

export async function runSalesAnalysis(ownerId: string): Promise<{
  insightsCreated: number;
  recommendationsCreated: number;
}> {
  const [revenue, pipeline, quotes, opportunities] = await Promise.all([
    generateRevenueInsights(ownerId),
    generatePipelineInsights(ownerId),
    generateQuoteInsights(ownerId),
    generateOpportunityRecommendations(ownerId),
  ]);

  return {
    insightsCreated: revenue + pipeline,
    recommendationsCreated: quotes + opportunities,
  };
}

export async function getSalesAnalysisSummary(ownerId: string) {
  const [stats, insights, recommendations, opportunities, revenue, pipeline] = await Promise.all([
    getSalesAgentDashboardStats(ownerId),
    listSalesInsights(ownerId, { pageSize: 5, status: "ACTIVE" }),
    listSalesRecommendations(ownerId, { pageSize: 5, status: "NEW" }),
    detectSalesOpportunities(ownerId),
    getRevenueInsightSnapshot(ownerId),
    getPipelineAnalysisSnapshot(ownerId),
  ]);

  return { stats, insights, recommendations, opportunities, revenue, pipeline };
}
