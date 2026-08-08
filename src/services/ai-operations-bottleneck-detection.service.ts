import "server-only";

import { getKitchenDashboardStats } from "@/services/restaurant-kitchen-display.service";
import { getOrderDashboardStats } from "@/modules/orders/services/order-management-adapter.service";
import {
  createOperationInsight,
  createOperationRecommendation,
} from "@/services/ai-operations-efficiency-recommendation.service";
import { runOwnerDomainDetectionTask, runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";
import { getOwnedBusinessId, getPrimaryBranchId } from "@/services/ai-operations-context.service";

export interface BottleneckAlert {
  id: string;
  area: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  metric: number;
  recommendation: string;
}

export async function detectOperationalBottlenecks(ownerId: string): Promise<BottleneckAlert[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  const branchId = await getPrimaryBranchId(businessId);
  if (!branchId) {
    return [];
  }

  return runOwnerDomainDetectionTask<BottleneckAlert>(ownerId, {
    module: "operations",
    task: "operational-bottleneck-detection",
    responseKey: "alerts",
    loadContext: async () => {
      const [kitchen, orders] = await Promise.all([
        getKitchenDashboardStats(businessId, branchId),
        getOrderDashboardStats(businessId, branchId),
      ]);
      return { kitchen, orders };
    },
  });
}

export async function generateBottleneckInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "operations",
    task: "bottleneck-insights",
    loadContext: async (ownerId) => ({ ownerId }),
    persistInsight: (businessId, insight) =>
      createOperationInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "bottleneck",
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
