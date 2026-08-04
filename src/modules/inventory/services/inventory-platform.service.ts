import { INVENTORY_STOCK_STATUSES } from "@/modules/inventory/constants/inventory-status";
import { DEFAULT_INVENTORY_SCOPE } from "@/modules/inventory/constants/mock-data";
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
  businessId?: string;
  branchId?: string;
  userId?: string;
  defaultLocationId?: string;
}

export function buildInventoryPlatformContext(
  input: InventoryPlatformInput = {},
): InventoryPlatformContext {
  return {
    tenantId: input.tenantId ?? DEFAULT_INVENTORY_SCOPE.tenantId,
    workspaceId: input.workspaceId ?? DEFAULT_INVENTORY_SCOPE.workspaceId,
    businessId: input.businessId ?? DEFAULT_INVENTORY_SCOPE.businessId,
    branchId: input.branchId ?? DEFAULT_INVENTORY_SCOPE.branchId,
    userId: input.userId ?? DEFAULT_INVENTORY_SCOPE.userId,
    defaultLocationId: input.defaultLocationId ?? DEFAULT_INVENTORY_SCOPE.defaultLocationId,
  };
}

export function buildInventoryPlatformSnapshot(
  input: InventoryPlatformInput = {},
): InventoryPlatformSnapshot {
  const context = buildInventoryPlatformContext(input);
  const records = inventoryRepository
    .listRecords()
    .filter(
      (record) =>
        record.item.tenantId === context.tenantId && record.item.businessId === context.businessId,
    );

  const countByStatus = (status: string) =>
    records.filter((record) => record.item.status === status).length;

  const totalValueCents = records.reduce((sum, r) => sum + r.analytics.totalValueCents, 0);
  const wasteCostCents = records.reduce(
    (sum, r) => sum + r.wasteRecords.reduce((ws, w) => ws + w.costCents, 0),
    0,
  );

  const purchaseOrders = inventoryRepository.listPurchaseOrders();
  const pendingPurchaseOrders = purchaseOrders.filter(
    (po) => po.status === "draft" || po.status === "submitted" || po.status === "ordered",
  ).length;

  const expiringWithin3Days = inventoryRepository.getExpiringRecords(3).length;

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
    expiringWithin3Days,
  };
}

export function getDefaultInventorySnapshot(): InventoryPlatformSnapshot {
  return buildInventoryPlatformSnapshot();
}

export function getCriticalStockItems(limit = 10): InventoryRecord[] {
  return inventoryRepository.getLowStockRecords().slice(0, limit);
}
