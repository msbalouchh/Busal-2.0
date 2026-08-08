import "server-only";

import { getStaffAnalytics } from "@/services/reporting.service";
import {
  createOperationInsight,
  createOperationRecommendation,
} from "@/services/ai-operations-efficiency-recommendation.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";
import {
  getOwnedBusinessId,
} from "@/services/ai-operations-context.service";
import { prisma } from "@/lib/prisma";

export interface ResourceUtilizationSnapshot {
  activeStaff: number;
  staffWithOrders: number;
  utilizationRate: number;
  topPerformers: Array<{ name: string; ordersHandled: number }>;
  underutilized: Array<{ name: string; ordersHandled: number }>;
}

export async function getResourceUtilizationSnapshot(
  ownerId: string,
): Promise<ResourceUtilizationSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);

  const [activeStaff, analytics] = await Promise.all([
    prisma.staff.count({
      where: { businessId, isActive: true, employmentStatus: "ACTIVE" },
    }),
    getStaffAnalytics(businessId),
  ]);

  const staffWithOrders = analytics.filter((s) => s.ordersHandled > 0).length;
  const utilizationRate = activeStaff > 0 ? Math.round((staffWithOrders / activeStaff) * 100) : 0;

  const sorted = analytics
    .map((s) => ({ name: s.staffName, ordersHandled: s.ordersHandled }))
    .sort((a, b) => b.ordersHandled - a.ordersHandled);

  const avgOrders =
    sorted.length > 0 ? sorted.reduce((sum, s) => sum + s.ordersHandled, 0) / sorted.length : 0;

  return {
    activeStaff,
    staffWithOrders,
    utilizationRate,
    topPerformers: sorted.slice(0, 5),
    underutilized: sorted.filter((s) => s.ordersHandled < avgOrders / 2).slice(0, 5),
  };
}

export async function generateResourceOptimizationInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "operations",
    task: "resource-optimization-insights",
    loadContext: getResourceUtilizationSnapshot,
    persistInsight: (businessId, insight) =>
      createOperationInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "resource",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
    persistRecommendation: (businessId, recommendation) =>
      createOperationRecommendation(businessId, {
        title: recommendation.title,
        description: recommendation.description,
        action: recommendation.action ?? recommendation.recommendation ?? "Review AI recommendation",
        expectedImpact: recommendation.expectedImpact,
        confidenceScore: recommendation.confidenceScore,
        metadata: recommendation.metadata,
      }),
  });
}
