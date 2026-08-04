import { INVENTORY_STOCK_STATUSES } from "@/modules/inventory/constants/inventory-status";
import { DEFAULT_INVENTORY_SCOPE } from "@/modules/inventory/constants/mock-data";
import { inventoryService } from "@/modules/inventory/services/inventory.service";
import {
  buildInventoryPlatformSnapshot,
  getCriticalStockItems,
} from "@/modules/inventory/services/inventory-platform.service";
import {
  calculateReorderNeed,
  sortByStockUrgency,
} from "@/modules/inventory/utils/inventory-stock-utils";
import { getInventoryItemSummary } from "@/modules/inventory/utils/inventory-selectors";
import type {
  InventoryAiContext,
  InventoryRecord,
} from "@/modules/inventory/types/inventory-platform";

export function buildInventoryAiContext(itemId: string): InventoryAiContext | null {
  const record = inventoryService.getById(itemId);

  if (!record) {
    return null;
  }

  return {
    ...record.aiContext,
    summary: getInventoryItemSummary(record),
    insights: [
      ...record.aiContext.insights,
      `Status: ${record.item.status}`,
      `Turnover: ${record.analytics.turnoverRate}x/week`,
    ],
    lastGeneratedAt: new Date().toISOString(),
  };
}

export function createInventoryItemForAi(input: {
  sku: string;
  name: string;
  categoryId: string;
  unitId: string;
  reorderPoint: number;
  reorderQuantity: number;
  parLevel: number;
  costPerUnitCents: number;
}): Record<string, unknown> {
  const record = inventoryService.createItem({
    branchId: DEFAULT_INVENTORY_SCOPE.branchId,
    categoryId: input.categoryId,
    unitId: input.unitId,
    sku: input.sku,
    name: input.name,
    reorderPoint: input.reorderPoint,
    reorderQuantity: input.reorderQuantity,
    parLevel: input.parLevel,
    costPerUnitCents: input.costPerUnitCents,
  });

  return {
    itemId: record.item.id,
    sku: record.item.sku,
    name: record.item.name,
    status: record.item.status,
  };
}

export function updateStockForAi(
  itemId: string,
  quantityDelta: number,
  notes?: string,
): Record<string, unknown> | null {
  const updated = inventoryService.updateStock({
    itemId,
    locationId: DEFAULT_INVENTORY_SCOPE.defaultLocationId,
    quantityDelta,
    movementType: quantityDelta >= 0 ? "adjustment" : "sale",
    notes,
    employeeId: DEFAULT_INVENTORY_SCOPE.employeeId,
  });

  if (!updated) {
    return null;
  }

  const stock = updated.stocks[0];

  return {
    itemId,
    newQuantity: stock?.quantityOnHand ?? 0,
    status: updated.item.status,
  };
}

export function predictLowStock(limit = 10): Record<string, unknown> {
  const critical = getCriticalStockItems(limit);
  const expiring = inventoryService.getExpiringItems(3);

  return {
    lowStockCount: critical.length,
    expiringCount: expiring.length,
    items: critical.map(toStockSummary),
    expiring: expiring.map(toStockSummary),
    recommendation:
      critical.length > 0
        ? "Review and submit purchase orders for critical items"
        : "Stock levels healthy",
  };
}

export function forecastDemand(): Record<string, unknown> {
  const records = inventoryService.list();
  const perishables = records.filter((r) => r.item.isPerishable);

  return {
    branchId: DEFAULT_INVENTORY_SCOPE.branchId,
    forecastPeriodDays: 7,
    items: records.map((record) => ({
      itemId: record.item.id,
      name: record.item.name,
      forecastUnits: record.aiContext.demandForecastUnits,
      currentStock: record.stocks.reduce((sum, s) => sum + s.quantityOnHand, 0),
      turnoverRate: record.analytics.turnoverRate,
    })),
    perishableCount: perishables.length,
    peakDemandDay: "Saturday",
  };
}

export function recommendPurchaseOrders(): Record<string, unknown> {
  const lowStock = inventoryService.getLowStockItems();
  const sorted = sortByStockUrgency(lowStock);

  const recommendations = sorted.map((record) => ({
    itemId: record.item.id,
    itemName: record.item.name,
    currentQuantity: record.stocks.reduce((sum, s) => sum + s.quantityOnHand, 0),
    reorderQuantity: calculateReorderNeed(record) || record.item.reorderQuantity,
    estimatedCostCents: record.item.costPerUnitCents * record.item.reorderQuantity,
    supplierId: "supplier-meat-co",
    urgency: record.item.status === INVENTORY_STOCK_STATUSES.OUT_OF_STOCK ? "critical" : "warning",
  }));

  const totalCostCents = recommendations.reduce((sum, r) => sum + r.estimatedCostCents, 0);

  return {
    recommendationCount: recommendations.length,
    totalEstimatedCostCents: totalCostCents,
    recommendations,
    suggestedAction:
      recommendations.length > 0 ? "Create consolidated PO by supplier" : "No PO needed",
  };
}

export function detectInventoryWaste(): Record<string, unknown> {
  const records = inventoryService.list();
  const withWaste = records.filter((r) => r.wasteRecords.length > 0);
  const highWaste = records.filter((r) => r.analytics.wasteRateBps >= 500);

  return {
    totalWasteRecords: withWaste.reduce((sum, r) => sum + r.wasteRecords.length, 0),
    totalWasteCostCents: withWaste.reduce(
      (sum, r) => sum + r.wasteRecords.reduce((ws, w) => ws + w.costCents, 0),
      0,
    ),
    highWasteItems: highWaste.map((record) => ({
      itemId: record.item.id,
      name: record.item.name,
      wasteRateBps: record.analytics.wasteRateBps,
      wasteRiskScore: record.aiContext.wasteRiskScore,
    })),
    recommendations:
      highWaste.length > 0
        ? ["Review prep batch sizes", "Adjust par levels for perishables"]
        : ["Waste within acceptable thresholds"],
  };
}

export function suggestReorderQuantity(itemId: string): Record<string, unknown> | null {
  const record = inventoryService.getById(itemId);

  if (!record) {
    return null;
  }

  const current = record.stocks.reduce((sum, s) => sum + s.quantityOnHand, 0);
  const need = calculateReorderNeed(record);
  const suggested = need > 0 ? need : record.item.reorderQuantity;

  return {
    itemId,
    itemName: record.item.name,
    currentQuantity: current,
    reorderPoint: record.item.reorderPoint,
    parLevel: record.item.parLevel,
    suggestedReorderQuantity: suggested,
    rationale:
      need > 0
        ? `Below reorder point — order ${suggested} to reach par level`
        : "Stock adequate — standard reorder quantity if desired",
  };
}

export function optimizeStockLevels(): Record<string, unknown> {
  const snapshot = buildInventoryPlatformSnapshot();
  const records = inventoryService.list();

  const optimizations = records.map((record) => ({
    itemId: record.item.id,
    name: record.item.name,
    currentParLevel: record.item.parLevel,
    suggestedParLevel: Math.round(
      record.analytics.turnoverRate * record.analytics.reorderFrequencyDays * 1.2,
    ),
    optimizationScore: record.aiContext.stockOptimizationScore,
    action: record.aiContext.stockOptimizationScore < 0.5 ? "increase_par" : "maintain",
  }));

  const needsAttention = optimizations.filter((o) => o.action === "increase_par");

  return {
    branchId: snapshot.context.branchId,
    totalItems: records.length,
    lowStockCount: snapshot.lowStockCount,
    outOfStockCount: snapshot.outOfStockCount,
    optimizations,
    needsAttentionCount: needsAttention.length,
    estimatedSavingsCents:
      snapshot.wasteCostCents > 0 ? Math.round(snapshot.wasteCostCents * 0.3) : 0,
  };
}

function toStockSummary(record: InventoryRecord): Record<string, unknown> {
  return {
    itemId: record.item.id,
    name: record.item.name,
    sku: record.item.sku,
    status: record.item.status,
    quantityOnHand: record.stocks.reduce((sum, s) => sum + s.quantityOnHand, 0),
    reorderPoint: record.item.reorderPoint,
  };
}
