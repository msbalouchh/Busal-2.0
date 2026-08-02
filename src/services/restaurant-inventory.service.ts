import "server-only";

import type { InventoryItem, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { INVENTORY_LIST_PAGE_SIZE } from "@/modules/inventory-supplier-management/constants/routes";
import {
  buildInventoryListWhere,
  buildInventoryOrderBy,
  decimal,
  isLowStock,
  roundMoney,
  roundQuantity,
  validateInventoryItemInput,
  validateStockQuantityChange,
} from "@/modules/inventory-supplier-management/lib/inventory-supplier-validation";
import type {
  InventoryDashboardStats,
  InventoryHistoryQuery,
  InventoryHistoryResult,
  InventoryItemInput,
  InventoryItemRecord,
  InventoryListQuery,
  InventoryListResult,
  InventoryTransactionRecord,
  StockAdjustmentInput,
  StockTransferInput,
} from "@/modules/inventory-supplier-management/types/inventory-supplier-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

async function assertBranchInBusiness(businessId: string, branchId: string): Promise<void> {
  const branch = await prisma.branch.findFirst({ where: { id: branchId, businessId } });
  if (!branch) throw new Error("Branch not found");
}

function serializeInventoryItem(record: InventoryItem): InventoryItemRecord {
  const currentStock = decimal(Number(record.currentStock));
  const minimumStock = decimal(Number(record.minimumStock));
  const reorderLevel = record.reorderLevel != null ? decimal(Number(record.reorderLevel)) : null;

  return {
    id: record.id,
    businessId: record.businessId,
    branchId: record.branchId,
    sku: record.sku,
    barcode: record.barcode,
    name: record.name,
    description: record.description,
    category: record.category,
    unit: record.unit,
    currentStock,
    minimumStock,
    maximumStock: record.maximumStock != null ? decimal(Number(record.maximumStock)) : null,
    reorderLevel,
    averageCost: decimal(Number(record.averageCost)),
    status: record.status,
    trackStock: record.trackStock,
    isLowStock: isLowStock({
      currentStock,
      minimumStock,
      reorderLevel,
      trackStock: record.trackStock,
    }),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function generateSku(businessId: string, branchId: string): Promise<string> {
  const count = await prisma.inventoryItem.count({ where: { businessId, branchId } });
  return `INV-${String(count + 1).padStart(5, "0")}`;
}

export async function listManagedInventoryItems(
  ownerId: string,
  query: InventoryListQuery,
): Promise<InventoryListResult> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, query.branchId);

  const pageSize = query.pageSize ?? INVENTORY_LIST_PAGE_SIZE;
  const page = query.page ?? 1;
  const where = buildInventoryListWhere(businessId, query);

  const [total, records] = await Promise.all([
    prisma.inventoryItem.count({ where }),
    prisma.inventoryItem.findMany({
      where,
      orderBy: buildInventoryOrderBy(query),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  let items = records.map(serializeInventoryItem);
  if (query.lowStockOnly) {
    items = items.filter((item) => item.isLowStock);
  }

  return {
    items,
    total: query.lowStockOnly ? items.length : total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil((query.lowStockOnly ? items.length : total) / pageSize)),
  };
}

export async function getManagedInventoryItem(
  ownerId: string,
  branchId: string,
  itemId: string,
): Promise<InventoryItemRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const record = await prisma.inventoryItem.findFirst({
    where: { id: itemId, businessId, branchId, deletedAt: null },
  });
  if (!record) throw new Error("Inventory item not found");
  return serializeInventoryItem(record);
}

export async function createManagedInventoryItem(
  ownerId: string,
  branchId: string,
  input: InventoryItemInput,
): Promise<InventoryItemRecord> {
  validateInventoryItemInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, branchId);

  const sku = input.sku.trim();
  const existingSku = await prisma.inventoryItem.findFirst({
    where: { businessId, branchId, sku, deletedAt: null },
  });
  if (existingSku) throw new Error("SKU already exists for this branch");

  if (input.barcode?.trim()) {
    const existingBarcode = await prisma.inventoryItem.findFirst({
      where: { businessId, barcode: input.barcode.trim(), deletedAt: null },
    });
    if (existingBarcode) throw new Error("Barcode already in use");
  }

  const initialStock = roundQuantity(input.initialStock ?? 0);
  const record = await prisma.inventoryItem.create({
    data: {
      businessId,
      branchId,
      sku,
      barcode: input.barcode?.trim() || null,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      category: input.category?.trim() || null,
      unit: input.unit?.trim() || "each",
      currentStock: initialStock,
      minimumStock: roundQuantity(input.minimumStock ?? 0),
      maximumStock: input.maximumStock != null ? roundQuantity(input.maximumStock) : null,
      reorderLevel: input.reorderLevel != null ? roundQuantity(input.reorderLevel) : null,
      averageCost: roundQuantity(input.averageCost ?? 0),
      status: input.status ?? "ACTIVE",
      trackStock: input.trackStock ?? true,
    },
  });

  if (initialStock > 0) {
    await recordInventoryTransaction({
      inventoryItemId: record.id,
      transactionType: "ADJUSTMENT",
      quantity: initialStock,
      notes: "Initial stock",
    });
  }

  return serializeInventoryItem(record);
}

export async function updateManagedInventoryItem(
  ownerId: string,
  branchId: string,
  itemId: string,
  input: InventoryItemInput,
): Promise<InventoryItemRecord> {
  validateInventoryItemInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  await getManagedInventoryItem(ownerId, branchId, itemId);

  if (input.barcode?.trim()) {
    const existingBarcode = await prisma.inventoryItem.findFirst({
      where: { businessId, barcode: input.barcode.trim(), deletedAt: null, NOT: { id: itemId } },
    });
    if (existingBarcode) throw new Error("Barcode already in use");
  }

  const record = await prisma.inventoryItem.update({
    where: { id: itemId },
    data: {
      barcode: input.barcode?.trim() || null,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      category: input.category?.trim() || null,
      unit: input.unit?.trim() || "each",
      minimumStock: roundQuantity(input.minimumStock ?? 0),
      maximumStock: input.maximumStock != null ? roundQuantity(input.maximumStock) : null,
      reorderLevel: input.reorderLevel != null ? roundQuantity(input.reorderLevel) : null,
      averageCost: roundQuantity(input.averageCost ?? 0),
      status: input.status,
      trackStock: input.trackStock ?? true,
    },
  });

  return serializeInventoryItem(record);
}

export async function archiveManagedInventoryItem(
  ownerId: string,
  branchId: string,
  itemId: string,
): Promise<void> {
  await getManagedInventoryItem(ownerId, branchId, itemId);
  await prisma.inventoryItem.update({
    where: { id: itemId },
    data: { status: "ARCHIVED", deletedAt: new Date() },
  });
}

async function recordInventoryTransaction(input: {
  inventoryItemId: string;
  transactionType: Prisma.InventoryTransactionCreateInput["transactionType"];
  quantity: number;
  referenceType?: string | null;
  referenceId?: string | null;
  notes?: string | null;
  performedByStaffId?: string | null;
}): Promise<void> {
  await prisma.inventoryTransaction.create({
    data: {
      inventoryItemId: input.inventoryItemId,
      transactionType: input.transactionType,
      quantity: roundQuantity(input.quantity),
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      notes: input.notes ?? null,
      performedByStaffId: input.performedByStaffId ?? null,
    },
  });
}

async function applyStockChange(
  itemId: string,
  delta: number,
  input: {
    transactionType: Prisma.InventoryTransactionCreateInput["transactionType"];
    referenceType?: string | null;
    referenceId?: string | null;
    notes?: string | null;
    performedByStaffId?: string | null;
  },
): Promise<InventoryItemRecord> {
  const item = await prisma.inventoryItem.findUniqueOrThrow({ where: { id: itemId } });
  const currentStock = decimal(Number(item.currentStock));
  validateStockQuantityChange(currentStock, delta, item.trackStock);

  const nextStock = roundQuantity(currentStock + delta);
  const updated = await prisma.inventoryItem.update({
    where: { id: itemId },
    data: { currentStock: nextStock },
  });

  await recordInventoryTransaction({
    inventoryItemId: itemId,
    transactionType: input.transactionType,
    quantity: delta,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    notes: input.notes,
    performedByStaffId: input.performedByStaffId,
  });

  return serializeInventoryItem(updated);
}

export async function adjustManagedInventoryStock(
  ownerId: string,
  input: StockAdjustmentInput,
): Promise<InventoryItemRecord> {
  await getManagedInventoryItem(ownerId, input.branchId, input.inventoryItemId);
  if (input.quantity === 0) throw new Error("Adjustment quantity cannot be zero");
  return applyStockChange(input.inventoryItemId, roundQuantity(input.quantity), {
    transactionType: "ADJUSTMENT",
    notes: input.notes ?? "Manual stock adjustment",
  });
}

export async function transferManagedInventoryStock(
  ownerId: string,
  input: StockTransferInput,
): Promise<{ source: InventoryItemRecord; target: InventoryItemRecord }> {
  const [source, target] = await Promise.all([
    getManagedInventoryItem(ownerId, input.branchId, input.sourceItemId),
    getManagedInventoryItem(ownerId, input.branchId, input.targetItemId),
  ]);

  if (source.id === target.id) throw new Error("Cannot transfer to the same item");
  if (input.quantity <= 0) throw new Error("Transfer quantity must be greater than zero");

  const transferReference = `transfer-${Date.now()}`;
  const quantity = roundQuantity(input.quantity);

  const updatedSource = await applyStockChange(source.id, -quantity, {
    transactionType: "TRANSFER",
    referenceType: "TRANSFER",
    referenceId: transferReference,
    notes: input.notes ?? `Transfer to ${target.sku}`,
  });

  const updatedTarget = await applyStockChange(target.id, quantity, {
    transactionType: "TRANSFER",
    referenceType: "TRANSFER",
    referenceId: transferReference,
    notes: input.notes ?? `Transfer from ${source.sku}`,
  });

  return { source: updatedSource, target: updatedTarget };
}

export async function listLowStockItems(
  ownerId: string,
  branchId: string,
): Promise<InventoryItemRecord[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, branchId);

  const records = await prisma.inventoryItem.findMany({
    where: { businessId, branchId, deletedAt: null, status: "ACTIVE", trackStock: true },
    orderBy: [{ currentStock: "asc" }],
  });

  return records.map(serializeInventoryItem).filter((item) => item.isLowStock);
}

export async function getInventoryDashboardStats(
  ownerId: string,
  branchId: string,
): Promise<InventoryDashboardStats> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, branchId);

  const [items, openPurchaseOrders] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { businessId, branchId, deletedAt: null },
      select: {
        status: true,
        currentStock: true,
        minimumStock: true,
        reorderLevel: true,
        averageCost: true,
        trackStock: true,
      },
    }),
    prisma.purchaseOrder.count({
      where: {
        businessId,
        branchId,
        status: { in: ["DRAFT", "SENT", "PARTIALLY_RECEIVED"] },
      },
    }),
  ]);

  const serialized = items.map((item) => {
    const currentStock = decimal(Number(item.currentStock));
    const minimumStock = decimal(Number(item.minimumStock));
    const reorderLevel = item.reorderLevel != null ? decimal(Number(item.reorderLevel)) : null;
    return {
      currentStock,
      minimumStock,
      reorderLevel,
      trackStock: item.trackStock,
      averageCost: decimal(Number(item.averageCost)),
      status: item.status,
      isLowStock: isLowStock({
        currentStock,
        minimumStock,
        reorderLevel,
        trackStock: item.trackStock,
      }),
    };
  });

  return {
    totalItems: items.length,
    activeItems: items.filter((item) => item.status === "ACTIVE").length,
    lowStockCount: serialized.filter((item) => item.isLowStock && item.currentStock > 0).length,
    outOfStockCount: serialized.filter((item) => item.trackStock && item.currentStock <= 0).length,
    totalStockValue: roundMoney(
      serialized.reduce((sum, item) => sum + item.currentStock * item.averageCost, 0),
    ),
    openPurchaseOrders,
  };
}

export async function listInventoryHistory(
  ownerId: string,
  query: InventoryHistoryQuery,
): Promise<InventoryHistoryResult> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, query.branchId);

  const pageSize = query.pageSize ?? 30;
  const page = query.page ?? 1;

  const where: Prisma.InventoryTransactionWhereInput = {
    inventoryItem: { businessId, branchId: query.branchId, deletedAt: null },
  };

  if (query.inventoryItemId) where.inventoryItemId = query.inventoryItemId;
  if (query.transactionType && query.transactionType !== "ALL") {
    where.transactionType = query.transactionType;
  }

  const [total, records] = await Promise.all([
    prisma.inventoryTransaction.count({ where }),
    prisma.inventoryTransaction.findMany({
      where,
      include: {
        inventoryItem: { select: { name: true, sku: true } },
        performedBy: { select: { fullName: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const items: InventoryTransactionRecord[] = records.map((record) => ({
    id: record.id,
    inventoryItemId: record.inventoryItemId,
    inventoryItemName: record.inventoryItem.name,
    inventoryItemSku: record.inventoryItem.sku,
    transactionType: record.transactionType,
    quantity: decimal(Number(record.quantity)),
    referenceType: record.referenceType,
    referenceId: record.referenceId,
    notes: record.notes,
    performedByStaffId: record.performedByStaffId,
    performedByName: record.performedBy
      ? record.performedBy.fullName ||
        `${record.performedBy.firstName} ${record.performedBy.lastName}`.trim()
      : null,
    createdAt: record.createdAt.toISOString(),
  }));

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function listInventoryItemsForSelect(
  ownerId: string,
  branchId: string,
): Promise<Array<{ id: string; label: string; sku: string; unit: string }>> {
  const businessId = await getOwnedBusinessId(ownerId);
  const records = await prisma.inventoryItem.findMany({
    where: { businessId, branchId, deletedAt: null, status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, sku: true, unit: true },
  });

  return records.map((record) => ({
    id: record.id,
    label: `${record.name} (${record.sku})`,
    sku: record.sku,
    unit: record.unit,
  }));
}

export { generateSku, serializeInventoryItem, applyStockChange };
