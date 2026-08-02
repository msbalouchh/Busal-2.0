import type { InventoryStatus, Prisma, PurchaseOrderStatus, SupplierStatus } from "@prisma/client";

import type {
  InventoryItemInput,
  InventoryListQuery,
  PurchaseOrderInput,
  SupplierInput,
} from "@/modules/inventory-supplier-management/types/inventory-supplier-types";

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function roundQuantity(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export function decimal(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function isLowStock(item: {
  currentStock: number;
  minimumStock: number;
  reorderLevel: number | null;
  trackStock: boolean;
}): boolean {
  if (!item.trackStock) return false;
  const threshold = item.reorderLevel ?? item.minimumStock;
  return item.currentStock <= threshold;
}

export function validateInventoryItemInput(input: InventoryItemInput): void {
  if (!input.sku?.trim()) throw new Error("SKU is required");
  if (!input.name?.trim()) throw new Error("Item name is required");
  if ((input.minimumStock ?? 0) < 0) throw new Error("Minimum stock cannot be negative");
  if (input.maximumStock != null && input.maximumStock < 0) {
    throw new Error("Maximum stock cannot be negative");
  }
  if (input.reorderLevel != null && input.reorderLevel < 0) {
    throw new Error("Reorder level cannot be negative");
  }
  if ((input.averageCost ?? 0) < 0) throw new Error("Average cost cannot be negative");
}

export function validateSupplierInput(input: SupplierInput): void {
  if (!input.name?.trim()) throw new Error("Supplier name is required");
  if (input.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    throw new Error("Invalid supplier email");
  }
}

export function validatePurchaseOrderInput(input: PurchaseOrderInput): void {
  if (!input.supplierId) throw new Error("Supplier is required");
  if (!input.items.length) throw new Error("Purchase order must include at least one item");
  for (const line of input.items) {
    if (line.quantity <= 0) throw new Error("Item quantity must be greater than zero");
    if (line.unitCost < 0) throw new Error("Unit cost cannot be negative");
  }
}

export function validateStockQuantityChange(
  currentStock: number,
  delta: number,
  trackStock: boolean,
): void {
  if (!trackStock) return;
  if (roundQuantity(currentStock + delta) < 0) {
    throw new Error("Stock cannot be negative");
  }
}

export function buildInventoryListWhere(
  businessId: string,
  query: InventoryListQuery,
): Prisma.InventoryItemWhereInput {
  const where: Prisma.InventoryItemWhereInput = {
    businessId,
    branchId: query.branchId,
    deletedAt: null,
  };

  if (query.status && query.status !== "ALL") {
    where.status = query.status;
  }

  if (query.category?.trim()) {
    where.category = query.category.trim();
  }

  if (query.search?.trim()) {
    const search = query.search.trim();
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

export function buildInventoryOrderBy(
  query: InventoryListQuery,
): Prisma.InventoryItemOrderByWithRelationInput {
  const direction = query.sortDirection ?? "asc";
  switch (query.sortBy) {
    case "sku":
      return { sku: direction };
    case "currentStock":
      return { currentStock: direction };
    case "updatedAt":
      return { updatedAt: direction };
    default:
      return { name: direction };
  }
}

export function buildSupplierListWhere(
  businessId: string,
  query: { search?: string; status?: SupplierStatus | "ALL" },
): Prisma.SupplierWhereInput {
  const where: Prisma.SupplierWhereInput = { businessId, deletedAt: null };
  if (query.status && query.status !== "ALL") where.status = query.status;
  if (query.search?.trim()) {
    const search = query.search.trim();
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { contactName: { contains: search, mode: "insensitive" } },
    ];
  }
  return where;
}

export function buildPurchaseOrderListWhere(
  businessId: string,
  query: {
    branchId: string;
    search?: string;
    status?: PurchaseOrderStatus | "ALL";
    supplierId?: string;
  },
): Prisma.PurchaseOrderWhereInput {
  const where: Prisma.PurchaseOrderWhereInput = {
    businessId,
    branchId: query.branchId,
  };

  if (query.status && query.status !== "ALL") where.status = query.status;
  if (query.supplierId) where.supplierId = query.supplierId;

  if (query.search?.trim()) {
    where.purchaseOrderNumber = { contains: query.search.trim(), mode: "insensitive" };
  }

  return where;
}

export const INVENTORY_STATUS_LABELS: Record<InventoryStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};

export const SUPPLIER_STATUS_LABELS: Record<SupplierStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PARTIALLY_RECEIVED: "Partially received",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};
