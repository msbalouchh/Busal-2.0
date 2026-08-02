import "server-only";

import { prisma } from "@/lib/prisma";
import { generateWorkflowInsights } from "@/services/ai-operations-workflow-analysis.service";
import { generateResourceOptimizationInsights } from "@/services/ai-operations-resource-optimization.service";
import { generateInventoryHealthInsights } from "@/services/ai-operations-inventory-health.service";
import { generateBottleneckInsights } from "@/services/ai-operations-bottleneck-detection.service";
import { generateCapacityInsights } from "@/services/ai-operations-capacity-planning.service";
import { generateOperationalHealthInsights } from "@/services/ai-operations-operational-health.service";
import { generateOperationalRiskInsights } from "@/services/ai-operations-risk-detection.service";
import { generateTrendInsights } from "@/services/ai-operations-trend-analysis.service";
import {
  listOperationInsights,
  listOperationRecommendations,
} from "@/services/ai-operations-efficiency-recommendation.service";
import { getOperationalHealthSnapshot } from "@/services/ai-operations-operational-health.service";
import { detectOperationalBottlenecks } from "@/services/ai-operations-bottleneck-detection.service";
import { detectOperationalRisks } from "@/services/ai-operations-risk-detection.service";
import { getOperationalTrendSnapshot } from "@/services/ai-operations-trend-analysis.service";
import { getOwnedBusinessId } from "@/services/ai-operations-context.service";

export interface OperationsAgentDashboardStats {
  totalInsights: number;
  activeInsights: number;
  totalRecommendations: number;
  newRecommendations: number;
  healthScore: number;
  healthLabel: string;
  bottleneckCount: number;
  riskCount: number;
  pendingOrders: number;
  utilizationRate: number;
}

export async function getOperationsAgentDashboardStats(
  ownerId: string,
): Promise<OperationsAgentDashboardStats> {
  const businessId = await getOwnedBusinessId(ownerId);

  const [insightCounts, recommendationCounts, health, bottlenecks, risks] = await Promise.all([
    prisma.aIOperationInsight.groupBy({
      by: ["status"],
      where: { businessId },
      _count: { _all: true },
    }),
    prisma.aIOperationRecommendation.groupBy({
      by: ["status"],
      where: { businessId },
      _count: { _all: true },
    }),
    getOperationalHealthSnapshot(ownerId),
    detectOperationalBottlenecks(ownerId),
    detectOperationalRisks(ownerId),
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
    bottleneckCount: bottlenecks.length,
    riskCount: risks.length,
    pendingOrders: health.pendingOrders,
    utilizationRate: health.utilizationRate,
  };
}

export async function runOperationsAnalysis(
  ownerId: string,
): Promise<{ insightsCreated: number; recommendationsCreated: number }> {
  const results = await Promise.all([
    generateWorkflowInsights(ownerId),
    generateResourceOptimizationInsights(ownerId),
    generateInventoryHealthInsights(ownerId),
    generateBottleneckInsights(ownerId),
    generateCapacityInsights(ownerId),
    generateOperationalHealthInsights(ownerId),
    generateOperationalRiskInsights(ownerId),
    generateTrendInsights(ownerId),
  ]);

  const total = results.reduce((sum, count) => sum + count, 0);

  return {
    insightsCreated: total,
    recommendationsCreated: 0,
  };
}

export async function getOperationsAnalysisSummary(ownerId: string) {
  const [stats, insights, recommendations, health, bottlenecks, risks, trends] = await Promise.all([
    getOperationsAgentDashboardStats(ownerId),
    listOperationInsights(ownerId, { pageSize: 5, status: "ACTIVE" }),
    listOperationRecommendations(ownerId, { pageSize: 5, status: "NEW" }),
    getOperationalHealthSnapshot(ownerId),
    detectOperationalBottlenecks(ownerId),
    detectOperationalRisks(ownerId),
    getOperationalTrendSnapshot(ownerId),
  ]);

  return { stats, insights, recommendations, health, bottlenecks, risks, trends };
}
