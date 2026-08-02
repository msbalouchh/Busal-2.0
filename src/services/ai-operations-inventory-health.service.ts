import "server-only";

import { getInventoryDashboard } from "@/services/restaurant-analytics.service";
import { getInventoryDashboard as getLegacyInventoryDashboard } from "@/services/inventory.service";
import { createOperationInsight } from "@/services/ai-operations-efficiency-recommendation.service";
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
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getInventoryHealthSnapshot(ownerId);
  let created = 0;

  if (snapshot.lowStockCount > 0) {
    await createOperationInsight(businessId, {
      title: "Inventory shortages affecting operations",
      description: `${snapshot.lowStockCount} items at or below reorder level.`,
      category: "inventory",
      priority: snapshot.lowStockCount > 5 ? "CRITICAL" : "HIGH",
      recommendation: snapshot.affectedItems.slice(0, 5).join(", ") || "Review purchase orders.",
      metadata: { lowStockCount: snapshot.lowStockCount },
    });
    created += 1;
  }

  if (snapshot.outOfStockCount > 0) {
    await createOperationInsight(businessId, {
      title: "Out-of-stock items",
      description: `${snapshot.outOfStockCount} ingredients out of stock.`,
      category: "inventory",
      priority: "CRITICAL",
      recommendation: "Expedite purchase orders and update menu availability.",
      metadata: { outOfStockCount: snapshot.outOfStockCount },
    });
    created += 1;
  }

  return created;
}
