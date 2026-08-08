import "server-only";

import { INVENTORY_STOCK_STATUSES, PURCHASE_ORDER_STATUSES } from "@/modules/inventory/constants/inventory-status";
import { buildInventoryPlatformContext } from "@/modules/inventory/lib/inventory-platform-context";
import { resolveInventoryScope, toInventoryPlatformContext } from "@/modules/inventory/lib/inventory-scope";
import { inventoryRepository } from "@/modules/inventory/repository/inventory-repository";
import type {
  InventoryPlatformContext,
  InventoryRecord,
} from "@/modules/inventory/types/inventory-platform";

export interface InventoryPlatformSnapshot {
  context: InventoryPlatformContext;
  records: InventoryRecord[];
  itemCount: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiredCount: number;
  totalValueCents: number;
  pendingPurchaseOrders: number;
  wasteCostCents: number;
  expiringWithin3Days: number;
}

export interface InventoryPlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId: string;
  branchId: string;
  userId?: string;
  defaultLocationId?: string;
}

export { buildInventoryPlatformContext };

export async function buildInventoryPlatformSnapshot(
  context: InventoryPlatformContext,
): Promise<InventoryPlatformSnapshot> {
  const scope = {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
    defaultLocationId: context.defaultLocationId,
  };

  const [records, purchaseOrders, expiring] = await Promise.all([
    inventoryRepository.listRecords(scope),
    inventoryRepository.listPurchaseOrders(scope),
    inventoryRepository.getExpiringRecords(scope, 3),
  ]);

  const countByStatus = (status: string) =>
    records.filter((record) => record.item.status === status).length;

  const totalValueCents = records.reduce((sum, record) => sum + record.analytics.totalValueCents, 0);
  const wasteCostCents = records.reduce(
    (sum, record) => sum + record.wasteRecords.reduce((total, waste) => total + waste.costCents, 0),
    0,
  );

  const pendingPurchaseOrders = purchaseOrders.filter(
    (order) =>
      order.status === PURCHASE_ORDER_STATUSES.DRAFT ||
      order.status === PURCHASE_ORDER_STATUSES.ORDERED ||
      order.status === PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED,
  ).length;

  return {
    context,
    records,
    itemCount: records.length,
    inStockCount: countByStatus(INVENTORY_STOCK_STATUSES.IN_STOCK),
    lowStockCount: countByStatus(INVENTORY_STOCK_STATUSES.LOW_STOCK),
    outOfStockCount: countByStatus(INVENTORY_STOCK_STATUSES.OUT_OF_STOCK),
    expiredCount: countByStatus(INVENTORY_STOCK_STATUSES.EXPIRED),
    totalValueCents,
    pendingPurchaseOrders,
    wasteCostCents,
    expiringWithin3Days: expiring.length,
  };
}

export async function getCriticalStockItems(
  context: InventoryPlatformContext,
  limit = 10,
): Promise<InventoryRecord[]> {
  const scope = {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
    defaultLocationId: context.defaultLocationId,
  };

  const records = await inventoryRepository.getLowStockRecords(scope);
  return records.slice(0, limit);
}

export function buildInventoryPlatformContextFromPlatform(
  platform: Parameters<typeof resolveInventoryScope>[0],
) {
  return toInventoryPlatformContext(resolveInventoryScope(platform));
}
