import "server-only";

import {
  getOrdersDashboard,
  getKitchenDashboard,
  getExecutiveDashboard,
} from "@/services/restaurant-analytics.service";
import { createOperationInsight } from "@/services/ai-operations-efficiency-recommendation.service";
import {
  defaultAnalyticsFilters,
  weekAnalyticsFilters,
  getOwnedBusinessId,
  getPrimaryBranchId,
} from "@/services/ai-operations-context.service";

export interface OperationalTrendPoint {
  label: string;
  value: number;
  metric: string;
}

export interface OperationalTrendSnapshot {
  orderTrend: OperationalTrendPoint[];
  kitchenPrepMinutes: number | null;
  revenueTrend: OperationalTrendPoint[];
  summary: string;
}

export async function getOperationalTrendSnapshot(
  ownerId: string,
): Promise<OperationalTrendSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);
  const branchId = await getPrimaryBranchId(businessId);

  const [todayOrders, weekOrders, kitchen, executive] = await Promise.all([
    getOrdersDashboard(ownerId, defaultAnalyticsFilters(branchId)),
    getOrdersDashboard(ownerId, weekAnalyticsFilters(branchId)),
    getKitchenDashboard(ownerId, weekAnalyticsFilters(branchId)),
    getExecutiveDashboard(ownerId, weekAnalyticsFilters(branchId)),
  ]);

  const orderTrend = weekOrders.ordersByDay.map((point) => ({
    label: point.label,
    value: point.value,
    metric: "orders",
  }));

  const revenueTrend =
    executive.revenueTrend?.map((point) => ({
      label: point.label,
      value: point.value,
      metric: "revenue",
    })) ?? [];

  const todayTotal = Number(todayOrders.kpis[0]?.value ?? 0);
  const weekTotal = weekOrders.ordersByDay.reduce((sum, p) => sum + p.value, 0);
  const dailyAvg =
    weekTotal > 0 ? Math.round(weekTotal / Math.max(1, weekOrders.ordersByDay.length)) : 0;

  const summary =
    todayTotal > dailyAvg * 1.2
      ? "Today's order volume is above weekly average — ensure adequate staffing."
      : todayTotal < dailyAvg * 0.8
        ? "Today's order volume is below average — review marketing and operations."
        : "Order volume is consistent with weekly trends.";

  return {
    orderTrend,
    kitchenPrepMinutes: kitchen.averagePrepMinutes,
    revenueTrend,
    summary,
  };
}

export async function generateTrendInsights(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const trends = await getOperationalTrendSnapshot(ownerId);
  let created = 0;

  await createOperationInsight(businessId, {
    title: "Operational trend summary",
    description: trends.summary,
    category: "trend",
    priority: "MEDIUM",
    recommendation:
      "Compare daily metrics against weekly baseline to adjust staffing and inventory.",
    metadata: {
      orderPoints: trends.orderTrend.length,
      avgPrepMinutes: trends.kitchenPrepMinutes,
    },
  });
  created += 1;

  return created;
}
