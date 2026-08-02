"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { INVENTORY_SUPPLIER_ROUTES } from "@/modules/inventory-supplier-management/constants/routes";
import { requireInventorySupplierActionContext } from "@/modules/inventory-supplier-management/lib/get-inventory-supplier-context";
import type {
  InventoryItemInput,
  PurchaseOrderInput,
  ReceiveStockInput,
  StockAdjustmentInput,
  StockTransferInput,
  SupplierInput,
} from "@/modules/inventory-supplier-management/types/inventory-supplier-types";
import {
  adjustManagedInventoryStock,
  archiveManagedInventoryItem,
  createManagedInventoryItem,
  transferManagedInventoryStock,
  updateManagedInventoryItem,
} from "@/services/restaurant-inventory.service";
import {
  cancelManagedPurchaseOrder,
  createManagedPurchaseOrder,
  receiveManagedPurchaseOrderStock,
  sendManagedPurchaseOrder,
} from "@/services/restaurant-purchase-order.service";
import {
  archiveManagedSupplier,
  createManagedSupplier,
  updateManagedSupplier,
} from "@/services/restaurant-supplier.service";

function revalidateInventoryPages(branchId: string, itemId?: string, purchaseOrderId?: string) {
  revalidatePath(INVENTORY_SUPPLIER_ROUTES.dashboardForBranch(branchId));
  revalidatePath(INVENTORY_SUPPLIER_ROUTES.suppliers(branchId));
  revalidatePath(INVENTORY_SUPPLIER_ROUTES.purchaseOrders(branchId));
  revalidatePath(INVENTORY_SUPPLIER_ROUTES.lowStock(branchId));
  revalidatePath(INVENTORY_SUPPLIER_ROUTES.history(branchId));
  if (itemId) {
    revalidatePath(INVENTORY_SUPPLIER_ROUTES.item(itemId, branchId));
  }
  if (purchaseOrderId) {
    revalidatePath(INVENTORY_SUPPLIER_ROUTES.purchaseOrder(purchaseOrderId, branchId));
  }
}

export async function createInventoryItemAction(branchId: string, input: InventoryItemInput) {
  const context = await requireInventorySupplierActionContext(PERMISSION_CODES.INVENTORY_CREATE);
  const item = await createManagedInventoryItem(context.user.id, branchId, input);
  revalidateInventoryPages(branchId, item.id);
  return item;
}

export async function updateInventoryItemAction(
  branchId: string,
  itemId: string,
  input: InventoryItemInput,
) {
  const context = await requireInventorySupplierActionContext(PERMISSION_CODES.INVENTORY_UPDATE);
  const item = await updateManagedInventoryItem(context.user.id, branchId, itemId, input);
  revalidateInventoryPages(branchId, itemId);
  return item;
}

export async function archiveInventoryItemAction(branchId: string, itemId: string) {
  const context = await requireInventorySupplierActionContext(PERMISSION_CODES.INVENTORY_DELETE);
  await archiveManagedInventoryItem(context.user.id, branchId, itemId);
  revalidateInventoryPages(branchId, itemId);
  return { success: true };
}

export async function adjustInventoryStockAction(input: StockAdjustmentInput) {
  const context = await requireInventorySupplierActionContext(PERMISSION_CODES.INVENTORY_ADJUST);
  const item = await adjustManagedInventoryStock(context.user.id, input);
  revalidateInventoryPages(input.branchId, input.inventoryItemId);
  return item;
}

export async function transferInventoryStockAction(input: StockTransferInput) {
  const context = await requireInventorySupplierActionContext(PERMISSION_CODES.INVENTORY_ADJUST);
  const result = await transferManagedInventoryStock(context.user.id, input);
  revalidateInventoryPages(input.branchId, input.sourceItemId);
  revalidateInventoryPages(input.branchId, input.targetItemId);
  return result;
}

export async function createSupplierAction(input: SupplierInput) {
  const context = await requireInventorySupplierActionContext(PERMISSION_CODES.SUPPLIER_CREATE);
  const supplier = await createManagedSupplier(context.user.id, input);
  revalidatePath(INVENTORY_SUPPLIER_ROUTES.suppliers());
  return supplier;
}

export async function updateSupplierAction(supplierId: string, input: SupplierInput) {
  const context = await requireInventorySupplierActionContext(PERMISSION_CODES.SUPPLIER_UPDATE);
  const supplier = await updateManagedSupplier(context.user.id, supplierId, input);
  revalidatePath(INVENTORY_SUPPLIER_ROUTES.suppliers());
  revalidatePath(INVENTORY_SUPPLIER_ROUTES.supplier(supplierId));
  return supplier;
}

export async function archiveSupplierAction(supplierId: string) {
  const context = await requireInventorySupplierActionContext(PERMISSION_CODES.SUPPLIER_UPDATE);
  await archiveManagedSupplier(context.user.id, supplierId);
  revalidatePath(INVENTORY_SUPPLIER_ROUTES.suppliers());
  return { success: true };
}

export async function createPurchaseOrderAction(input: PurchaseOrderInput) {
  const context = await requireInventorySupplierActionContext(
    PERMISSION_CODES.PURCHASE_ORDER_CREATE,
  );
  const purchaseOrder = await createManagedPurchaseOrder(context.user.id, input);
  revalidateInventoryPages(input.branchId, undefined, purchaseOrder.id);
  return purchaseOrder;
}

export async function sendPurchaseOrderAction(branchId: string, purchaseOrderId: string) {
  const context = await requireInventorySupplierActionContext(
    PERMISSION_CODES.PURCHASE_ORDER_CREATE,
  );
  const purchaseOrder = await sendManagedPurchaseOrder(context.user.id, branchId, purchaseOrderId);
  revalidateInventoryPages(branchId, undefined, purchaseOrderId);
  return purchaseOrder;
}

export async function cancelPurchaseOrderAction(branchId: string, purchaseOrderId: string) {
  const context = await requireInventorySupplierActionContext(
    PERMISSION_CODES.PURCHASE_ORDER_CREATE,
  );
  const purchaseOrder = await cancelManagedPurchaseOrder(
    context.user.id,
    branchId,
    purchaseOrderId,
  );
  revalidateInventoryPages(branchId, undefined, purchaseOrderId);
  return purchaseOrder;
}

export async function receivePurchaseOrderStockAction(input: ReceiveStockInput) {
  const context = await requireInventorySupplierActionContext(
    PERMISSION_CODES.PURCHASE_ORDER_RECEIVE,
  );
  const purchaseOrder = await receiveManagedPurchaseOrderStock(context.user.id, input);
  revalidateInventoryPages(input.branchId, undefined, input.purchaseOrderId);
  return purchaseOrder;
}
