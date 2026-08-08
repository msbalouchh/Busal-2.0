"use server";

import { revalidatePath } from "next/cache";

import { INVENTORY_MODULE_PERMISSIONS } from "@/modules/inventory/constants/permissions";
import { INVENTORY_PLATFORM_ROUTES } from "@/modules/inventory/constants/platform-routes";
import { resolveInventoryScope, toInventoryPlatformContext } from "@/modules/inventory/lib/inventory-scope";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { inventoryService } from "@/modules/inventory/services/inventory.service";
import {
  createInventoryItemSchema,
  createInventoryPurchaseOrderSchema,
  createInventoryTransferSchema,
  inventoryBulkActionSchema,
  inventoryItemActionSchema,
  receiveInventoryGoodsSchema,
  recordInventoryWasteSchema,
  updateInventoryItemSchema,
  updateInventoryStockSchema,
} from "@/modules/inventory/validation/inventory-schemas";

function revalidateInventoryPlatformPaths() {
  Object.values(INVENTORY_PLATFORM_ROUTES).forEach((path) => revalidatePath(path));
}

export async function createInventoryPlatformItemAction(input: unknown) {
  return protectedAction(INVENTORY_MODULE_PERMISSIONS.INVENTORY_CREATE, async ({ platform }) => {
    const body = createInventoryItemSchema.parse(input);
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const record = await inventoryService.createItem(context, body);
    revalidateInventoryPlatformPaths();
    return { success: true as const, record };
  });
}

export async function updateInventoryPlatformItemAction(input: unknown) {
  return protectedAction(INVENTORY_MODULE_PERMISSIONS.INVENTORY_UPDATE, async ({ platform }) => {
    const body = updateInventoryItemSchema.parse(input);
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const record = await inventoryService.updateItem(context, body);
    revalidateInventoryPlatformPaths();
    return { success: true as const, record };
  });
}

export async function archiveInventoryPlatformItemAction(input: unknown) {
  return protectedAction(INVENTORY_MODULE_PERMISSIONS.INVENTORY_DELETE, async ({ platform }) => {
    const body = inventoryItemActionSchema.parse(input);
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const record = await inventoryService.archiveItem(context, body.itemId);
    revalidateInventoryPlatformPaths();
    return { success: true as const, record };
  });
}

export async function restoreInventoryPlatformItemAction(input: unknown) {
  return protectedAction(INVENTORY_MODULE_PERMISSIONS.INVENTORY_UPDATE, async ({ platform }) => {
    const body = inventoryItemActionSchema.parse(input);
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const record = await inventoryService.restoreItem(context, body.itemId);
    revalidateInventoryPlatformPaths();
    return { success: true as const, record };
  });
}

export async function bulkInventoryPlatformAction(input: unknown) {
  return protectedAction(INVENTORY_MODULE_PERMISSIONS.INVENTORY_UPDATE, async ({ platform }) => {
    const body = inventoryBulkActionSchema.parse(input);
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const affected = await inventoryService.bulkAction(context, body);
    revalidateInventoryPlatformPaths();
    return { success: true as const, affected };
  });
}

export async function updateInventoryPlatformStockAction(input: unknown) {
  return protectedAction(INVENTORY_MODULE_PERMISSIONS.INVENTORY_UPDATE, async ({ platform }) => {
    const body = updateInventoryStockSchema.parse(input);
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const record = await inventoryService.updateStock(context, body);
    revalidateInventoryPlatformPaths();
    return { success: true as const, record };
  });
}

export async function recordInventoryPlatformWasteAction(input: unknown) {
  return protectedAction(INVENTORY_MODULE_PERMISSIONS.INVENTORY_UPDATE, async ({ platform }) => {
    const body = recordInventoryWasteSchema.parse(input);
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const record = await inventoryService.recordWaste(context, body);
    revalidateInventoryPlatformPaths();
    return { success: true as const, record };
  });
}

export async function createInventoryPlatformPurchaseOrderAction(input: unknown) {
  return protectedAction(INVENTORY_MODULE_PERMISSIONS.INVENTORY_CREATE, async ({ platform }) => {
    const body = createInventoryPurchaseOrderSchema.parse(input);
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const purchaseOrder = await inventoryService.createPurchaseOrder(context, body);
    revalidateInventoryPlatformPaths();
    return { success: true as const, purchaseOrder };
  });
}

export async function receiveInventoryPlatformGoodsAction(input: unknown) {
  return protectedAction(INVENTORY_MODULE_PERMISSIONS.INVENTORY_UPDATE, async ({ platform }) => {
    const body = receiveInventoryGoodsSchema.parse(input);
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const purchaseOrder = await inventoryService.receiveGoods(context, body);
    revalidateInventoryPlatformPaths();
    return { success: true as const, purchaseOrder };
  });
}

export async function createInventoryPlatformTransferAction(input: unknown) {
  return protectedAction(INVENTORY_MODULE_PERMISSIONS.INVENTORY_UPDATE, async ({ platform }) => {
    const body = createInventoryTransferSchema.parse(input);
    const context = toInventoryPlatformContext(resolveInventoryScope(platform));
    const record = await inventoryService.createTransfer(context, body);
    revalidateInventoryPlatformPaths();
    return { success: true as const, record };
  });
}
