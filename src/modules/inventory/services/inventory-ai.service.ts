import "server-only";

import { INVENTORY_STOCK_STATUSES } from "@/modules/inventory/constants/inventory-status";
import { inventoryService } from "@/modules/inventory/services/inventory.service";
import {
  buildInventoryPlatformSnapshot,
} from "@/modules/inventory/services/inventory-platform.service";
import { getInventoryItemSummary } from "@/modules/inventory/utils/inventory-selectors";
import {
  calculateReorderNeed,
  sortByStockUrgency,
} from "@/modules/inventory/utils/inventory-stock-utils";
import type { InventoryAiContext, InventoryPlatformContext, InventoryRecord } from "@/modules/inventory/types/inventory-platform";
import {
  resolveBusinessContextFromModule,
  runModuleAiJsonTask,
  type ModulePlatformContext,
} from "@/services/ai-engine-bridge.service";

const MODULE_NAME = "inventory";

function toModulePlatform(context: InventoryPlatformContext): ModulePlatformContext {
  return {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  };
}

async function runInventoryAiInference<T extends Record<string, unknown>>(
  context: InventoryPlatformContext,
  task: string,
  data: Record<string, unknown>,
  instructions?: string,
): Promise<T | null> {
  const platform = await resolveBusinessContextFromModule(toModulePlatform(context));
  return runModuleAiJsonTask<T>(platform, {
    module: MODULE_NAME,
    task,
    context: data,
    instructions,
  });
}

export async function buildInventoryAiContext(
  context: InventoryPlatformContext,
  itemId: string,
): Promise<InventoryAiContext | null> {
  const record = await inventoryService.getById(context, itemId);

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

export async function createInventoryItemForAi(
  context: InventoryPlatformContext,
  input: {
    sku: string;
    name: string;
    categoryId: string;
    unitId: string;
    reorderPoint: number;
    reorderQuantity: number;
    parLevel: number;
    costPerUnitCents: number;
  },
): Promise<Record<string, unknown>> {
  const record = await inventoryService.createItem(context, {
    branchId: context.branchId,
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

export async function updateStockForAi(
  context: InventoryPlatformContext,
  itemId: string,
  quantityDelta: number,
  notes?: string,
): Promise<Record<string, unknown> | null> {
  const updated = await inventoryService.updateStock(context, {
    itemId,
    locationId: context.defaultLocationId,
    quantityDelta,
    movementType: quantityDelta >= 0 ? "adjustment" : "sale",
    notes,
    employeeId: context.userId,
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

export async function predictLowStock(
  context: InventoryPlatformContext,
  limit = 10,
): Promise<Record<string, unknown>> {
  const critical = await getCriticalStockItems(context, limit);
  const expiring = await inventoryService.getExpiringItems(context, 3);
  const dataContext = {
    lowStockCount: critical.length,
    expiringCount: expiring.length,
    items: critical.map(toStockSummary),
    expiring: expiring.map(toStockSummary),
  };

  const aiResult = await runInventoryAiInference<Record<string, unknown>>(
    context,
    "predictLowStock",
    dataContext,
    "Predict low stock risks. Return JSON with lowStockCount, expiringCount, items, expiring, and recommendation.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function forecastDemand(context: InventoryPlatformContext): Promise<Record<string, unknown>> {
  const records = await inventoryService.list(context);
  const dataContext = {
    branchId: context.branchId,
    items: records.map((record) => ({
      itemId: record.item.id,
      name: record.item.name,
      forecastUnits: record.aiContext.demandForecastUnits,
      currentStock: record.stocks.reduce((sum, stock) => sum + stock.quantityOnHand, 0),
      turnoverRate: record.analytics.turnoverRate,
      isPerishable: record.item.isPerishable,
    })),
    perishableCount: records.filter((record) => record.item.isPerishable).length,
  };

  const aiResult = await runInventoryAiInference<Record<string, unknown>>(
    context,
    "forecastDemand",
    dataContext,
    "Forecast inventory demand. Return JSON with branchId, forecastPeriodDays, items, perishableCount, and peakDemandDay.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    branchId: context.branchId,
    itemCount: records.length,
    perishableCount: dataContext.perishableCount,
  };
}

export async function recommendPurchaseOrders(
  context: InventoryPlatformContext,
): Promise<Record<string, unknown>> {
  const lowStock = await inventoryService.getLowStockItems(context);
  const sorted = sortByStockUrgency(lowStock);
  const suppliers = await inventoryService.listSuppliers(context);
  const defaultSupplierId = suppliers[0]?.id ?? null;

  const recommendations = sorted.map((record) => ({
    itemId: record.item.id,
    itemName: record.item.name,
    currentQuantity: record.stocks.reduce((sum, stock) => sum + stock.quantityOnHand, 0),
    reorderQuantity: calculateReorderNeed(record) || record.item.reorderQuantity,
    estimatedCostCents: record.item.costPerUnitCents * record.item.reorderQuantity,
    supplierId: defaultSupplierId,
    urgency:
      record.item.status === INVENTORY_STOCK_STATUSES.OUT_OF_STOCK ? "critical" : "warning",
  }));

  const dataContext = {
    recommendationCount: recommendations.length,
    totalEstimatedCostCents: recommendations.reduce((sum, entry) => sum + entry.estimatedCostCents, 0),
    recommendations,
  };

  const aiResult = await runInventoryAiInference<Record<string, unknown>>(
    context,
    "recommendPurchaseOrders",
    dataContext,
    "Recommend purchase orders. Return JSON with recommendationCount, totalEstimatedCostCents, recommendations, and suggestedAction.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function detectInventoryWaste(context: InventoryPlatformContext): Promise<Record<string, unknown>> {
  const records = await inventoryService.list(context);
  const withWaste = records.filter((record) => record.wasteRecords.length > 0);
  const highWaste = records.filter((record) => record.analytics.wasteRateBps >= 500);
  const dataContext = {
    totalWasteRecords: withWaste.reduce((sum, record) => sum + record.wasteRecords.length, 0),
    totalWasteCostCents: withWaste.reduce(
      (sum, record) => sum + record.wasteRecords.reduce((total, waste) => total + waste.costCents, 0),
      0,
    ),
    highWasteItems: highWaste.map((record) => ({
      itemId: record.item.id,
      name: record.item.name,
      wasteRateBps: record.analytics.wasteRateBps,
      wasteRiskScore: record.aiContext.wasteRiskScore,
    })),
  };

  const aiResult = await runInventoryAiInference<Record<string, unknown>>(
    context,
    "detectInventoryWaste",
    dataContext,
    "Detect inventory waste patterns. Return JSON with totalWasteRecords, totalWasteCostCents, highWasteItems, and recommendations.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function suggestReorderQuantity(
  context: InventoryPlatformContext,
  itemId: string,
): Promise<Record<string, unknown> | null> {
  const record = await inventoryService.getById(context, itemId);

  if (!record) {
    return null;
  }

  const current = record.stocks.reduce((sum, stock) => sum + stock.quantityOnHand, 0);
  const need = calculateReorderNeed(record);
  const dataContext = {
    itemId,
    itemName: record.item.name,
    currentQuantity: current,
    reorderPoint: record.item.reorderPoint,
    parLevel: record.item.parLevel,
    reorderQuantity: record.item.reorderQuantity,
    calculatedNeed: need,
    turnoverRate: record.analytics.turnoverRate,
  };

  const aiResult = await runInventoryAiInference<Record<string, unknown>>(
    context,
    "suggestReorderQuantity",
    dataContext,
    "Suggest reorder quantity. Return JSON with itemId, itemName, currentQuantity, reorderPoint, parLevel, suggestedReorderQuantity, and rationale.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    itemId,
    itemName: record.item.name,
    currentQuantity: current,
    reorderPoint: record.item.reorderPoint,
    parLevel: record.item.parLevel,
    calculatedNeed: need,
  };
}

export async function optimizeStockLevels(context: InventoryPlatformContext): Promise<Record<string, unknown>> {
  const snapshot = await buildInventoryPlatformSnapshot(context);
  const records = await inventoryService.list(context);

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

  const needsAttention = optimizations.filter((entry) => entry.action === "increase_par");

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

export async function predictExpiryRisk(
  context: InventoryPlatformContext,
): Promise<Record<string, unknown>> {
  const expiring = await inventoryService.getExpiringItems(context, 7);
  const dataContext = {
    branchId: context.branchId,
    expiringCount: expiring.length,
    items: expiring.map((record) => ({
      itemId: record.item.id,
      name: record.item.name,
      expiryTracking: record.expiryTracking,
      wasteRiskScore: record.aiContext.wasteRiskScore,
    })),
  };

  const aiResult = await runInventoryAiInference<Record<string, unknown>>(
    context,
    "predictExpiryRisk",
    dataContext,
    "Predict expiry risk. Return JSON with branchId, expiringCount, items, and recommendation.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

async function getCriticalStockItems(context: InventoryPlatformContext, limit: number) {
  const { getCriticalStockItems: getCritical } = await import(
    "@/modules/inventory/services/inventory-platform.service"
  );
  return getCritical(context, limit);
}

function toStockSummary(record: InventoryRecord): Record<string, unknown> {
  return {
    itemId: record.item.id,
    name: record.item.name,
    sku: record.item.sku,
    status: record.item.status,
    quantityOnHand: record.stocks.reduce((sum, stock) => sum + stock.quantityOnHand, 0),
    reorderPoint: record.item.reorderPoint,
  };
}
