import "server-only";

import { getInventoryDashboard } from "@/services/restaurant-analytics.service";
import { getInventoryDashboard as getLegacyInventoryDashboard } from "@/services/inventory.service";
import { createOperationInsight } from "@/services/ai-operations-efficiency-recommendation.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";
import {
  defaultAnalyticsFilters,
  getOwnedBusinessId,
  getPrimaryBranchId,
} from "@/services/ai-operations-context.service";

export interface InventoryHealthSnapshot {
  lowStockCount: number;
  outOfStockCount: number;
  openPurchaseOrders: number;
  stockValue: number;
  affectedItems: string[];
}

export async function getInventoryHealthSnapshot(
  ownerId: string,
): Promise<InventoryHealthSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);
  const branchId = await getPrimaryBranchId(businessId);

  const [restaurantInv, legacyInv] = await Promise.all([
    getInventoryDashboard(ownerId, defaultAnalyticsFilters(branchId)),
    getLegacyInventoryDashboard(businessId, branchId).catch(() => null),
  ]);

  const lowStockCount = Number(restaurantInv.kpis[1]?.value ?? 0);
  const affectedItems =
    restaurantInv.lowStockItems?.map((item) => item.cells[0] ?? "Unknown") ?? [];

  return {
    lowStockCount,
    outOfStockCount: legacyInv?.outOfStock.length ?? 0,
    openPurchaseOrders: restaurantInv.purchaseOrdersOpen,
    stockValue: restaurantInv.stockValue,
    affectedItems,
  };
}

export async function generateInventoryHealthInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "operations",
    task: "inventory-health-insights",
    loadContext: getInventoryHealthSnapshot,
    persistInsight: (businessId, insight) =>
      createOperationInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "inventory",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
  });
}
