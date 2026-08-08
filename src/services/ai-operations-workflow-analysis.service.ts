import "server-only";

import {
  getOrdersDashboard,
} from "@/services/restaurant-analytics.service";
import { getOrderDashboardStats } from "@/modules/orders/services/order-management-adapter.service";
import { createOperationInsight } from "@/services/ai-operations-efficiency-recommendation.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";
import {
  defaultAnalyticsFilters,
  getOwnedBusinessId,
  getPrimaryBranchId,
} from "@/services/ai-operations-context.service";

export interface WorkflowSnapshot {
  totalOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  peakHour: string | null;
  ordersByStatus: Array<{ status: string; count: number }>;
  avgFulfillmentBlocked: number;
}

export async function getWorkflowSnapshot(ownerId: string): Promise<WorkflowSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);
  const branchId = await getPrimaryBranchId(businessId);
  const filters = defaultAnalyticsFilters(branchId);

  const [ordersDash, orderStats] = await Promise.all([
    getOrdersDashboard(ownerId, filters),
    branchId ? getOrderDashboardStats(businessId, branchId) : null,
  ]);

  const peak = ordersDash.ordersByHour.reduce(
    (best, point) => (point.value > (best?.value ?? 0) ? point : best),
    ordersDash.ordersByHour[0] ?? null,
  );

  return {
    totalOrders: Number(ordersDash.kpis[0]?.value ?? 0),
    cancelledOrders: ordersDash.cancelledOrders,
    pendingOrders: orderStats?.pendingToday ?? 0,
    peakHour: peak?.label ?? null,
    ordersByStatus: [],
    avgFulfillmentBlocked: orderStats?.preparingToday ?? 0,
  };
}

export async function generateWorkflowInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "operations",
    task: "workflow-insights",
    loadContext: getWorkflowSnapshot,
    persistInsight: (businessId, insight) =>
      createOperationInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "workflow",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
  });
}
