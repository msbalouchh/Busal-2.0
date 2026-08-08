import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { runInteractiveTransaction } from "@/lib/prisma-transaction";
import type { InventoryTenantScope } from "@/modules/inventory/lib/inventory-scope";
import {
  defaultBranchInventoryMeta,
  mapIngredientCategory,
  mapInventoryItemToRecord,
  mapPurchaseOrder,
  mapRecipeMappings,
  mapStringCategory,
  mapSupplier,
  synthesizeGrnFromReceive,
  type PurchaseOrderWithRelations,
  type RecipeWithRelations,
  type StoredInventoryBranchMeta,
} from "@/modules/inventory/lib/inventory-mappers";
import type {
  CreateInventoryItemInput,
  CreatePurchaseOrderInput,
  InventoryCategory,
  InventoryLocation,
  InventoryRecord,
  InventorySearchQuery,
  InventorySupplier,
  PurchaseOrder,
  RecipeIngredientMapping,
  RecordWasteInput,
  UpdateStockInput,
} from "@/modules/inventory/types/inventory-platform";
import type {
  CreateInventoryItemSchemaInput,
  CreateInventoryPurchaseOrderSchemaInput,
  CreateInventoryTransferSchemaInput,
  InventoryBulkActionSchemaInput,
  InventorySearchSchemaInput,
  ReceiveInventoryGoodsSchemaInput,
  RecordInventoryWasteSchemaInput,
  UpdateInventoryItemSchemaInput,
  UpdateInventoryStockSchemaInput,
} from "@/modules/inventory/validation/inventory-schemas";
import { applyStockChange } from "@/services/restaurant-inventory.service";

const DEFAULT_PAGE_SIZE = 25;

const itemInclude = {
  transactions: {
    orderBy: { createdAt: "desc" },
    take: 50,
  },
} satisfies Prisma.InventoryItemInclude;

const purchaseOrderInclude = {
  supplier: { select: { id: true, name: true } },
  items: {
    include: {
      inventoryItem: { select: { id: true, name: true, sku: true } },
    },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.PurchaseOrderInclude;

const recipeInclude = {
  menuItem: { select: { id: true, name: true } },
  lines: {
    include: {
      ingredient: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.RecipeInclude;

export interface InventorySearchResult {
  records: InventoryRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function roundQuantity(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function scopeItemWhere(
  scope: InventoryTenantScope,
  includeArchived = false,
): Prisma.InventoryItemWhereInput {
  return {
    businessId: scope.businessId,
    branchId: scope.branchId,
    ...(includeArchived ? {} : { deletedAt: null, status: { not: "ARCHIVED" } }),
  };
}

function itemOrderBy(
  sortBy?: InventorySearchSchemaInput["sortBy"],
  sortDirection?: InventorySearchSchemaInput["sortDirection"],
): Prisma.InventoryItemOrderByWithRelationInput {
  const direction = sortDirection === "asc" ? "asc" : "desc";

  switch (sortBy) {
    case "sku":
      return { sku: direction };
    case "stock":
      return { currentStock: direction };
    case "updatedAt":
      return { updatedAt: direction };
    case "name":
    default:
      return { name: direction };
  }
}

/** Prisma-backed inventory repository with tenant scoping. */
export class InventoryRepository {
  private async loadBranchMeta(scope: InventoryTenantScope): Promise<StoredInventoryBranchMeta> {
    const settings = await prisma.branchSettings.findUnique({
      where: { branchId: scope.branchId },
      select: { settings: true },
    });

    const raw = settings?.settings;
    if (raw && typeof raw === "object" && raw !== null && "inventoryOperations" in raw) {
      return (raw as unknown as { inventoryOperations: StoredInventoryBranchMeta }).inventoryOperations;
    }

    return defaultBranchInventoryMeta(scope);
  }

  private async saveBranchMeta(
    scope: InventoryTenantScope,
    meta: StoredInventoryBranchMeta,
  ): Promise<void> {
    const existing = await prisma.branchSettings.findUnique({
      where: { branchId: scope.branchId },
      select: { settings: true },
    });

    const settingsObject =
      existing?.settings && typeof existing.settings === "object" && existing.settings !== null
        ? (existing.settings as Record<string, unknown>)
        : {};

    await prisma.branchSettings.upsert({
      where: { branchId: scope.branchId },
      create: {
        branchId: scope.branchId,
        settings: { ...settingsObject, inventoryOperations: meta } as unknown as Prisma.InputJsonValue,
      },
      update: {
        settings: { ...settingsObject, inventoryOperations: meta } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private async loadCategories(scope: InventoryTenantScope): Promise<InventoryCategory[]> {
    const [ingredientCategories, itemCategories] = await Promise.all([
      prisma.ingredientCategory.findMany({
        where: { businessId: scope.businessId },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.inventoryItem.findMany({
        where: scopeItemWhere(scope, true),
        select: { category: true },
        distinct: ["category"],
      }),
    ]);

    const categories = ingredientCategories.map((category) =>
      mapIngredientCategory(scope, category),
    );

    for (const entry of itemCategories) {
      if (!entry.category) {
        continue;
      }

      const mapped = mapStringCategory(scope, entry.category);
      if (!categories.some((category) => category.id === mapped.id)) {
        categories.push(mapped);
      }
    }

    return categories;
  }

  private async loadRecipeMappings(scope: InventoryTenantScope): Promise<RecipeIngredientMapping[]> {
    const recipes = await prisma.recipe.findMany({
      where: { businessId: scope.businessId },
      include: recipeInclude,
    });

    return mapRecipeMappings(recipes as RecipeWithRelations[]);
  }

  private async buildRecord(
    scope: InventoryTenantScope,
    itemId: string,
    branchMeta: StoredInventoryBranchMeta,
    categories: InventoryCategory[],
    recipeMappings: RecipeIngredientMapping[],
  ): Promise<InventoryRecord | null> {
    const item = await prisma.inventoryItem.findFirst({
      where: { id: itemId, ...scopeItemWhere(scope, true) },
      include: itemInclude,
    });

    if (!item) {
      return null;
    }

    return mapInventoryItemToRecord(scope, item, branchMeta, categories, recipeMappings);
  }

  async listRecords(scope: InventoryTenantScope): Promise<InventoryRecord[]> {
    const [branchMeta, categories, recipeMappings, items] = await Promise.all([
      this.loadBranchMeta(scope),
      this.loadCategories(scope),
      this.loadRecipeMappings(scope),
      prisma.inventoryItem.findMany({
        where: scopeItemWhere(scope),
        include: itemInclude,
        orderBy: { name: "asc" },
      }),
    ]);

    return items.map((item) =>
      mapInventoryItemToRecord(scope, item, branchMeta, categories, recipeMappings),
    );
  }

  async search(
    scope: InventoryTenantScope,
    query: InventorySearchQuery | InventorySearchSchemaInput = {},
  ): Promise<InventorySearchResult> {
    const page = "page" in query && query.page ? query.page : 1;
    const pageSize =
      "limit" in query && query.limit
        ? query.limit
        : "pageSize" in query && query.pageSize
          ? query.pageSize
          : DEFAULT_PAGE_SIZE;
    const where: Prisma.InventoryItemWhereInput = {
      ...scopeItemWhere(scope, "includeArchived" in query ? query.includeArchived : false),
    };

    if (query.query) {
      where.OR = [
        { name: { contains: query.query, mode: "insensitive" } },
        { sku: { contains: query.query, mode: "insensitive" } },
        { barcode: { contains: query.query, mode: "insensitive" } },
      ];
    }

    if (query.categoryId) {
      const categories = await this.loadCategories(scope);
      const category = categories.find((entry) => entry.id === query.categoryId);
      if (category) {
        where.category = category.name;
      }
    }

    const [branchMeta, categories, recipeMappings, total, items] = await Promise.all([
      this.loadBranchMeta(scope),
      this.loadCategories(scope),
      this.loadRecipeMappings(scope),
      prisma.inventoryItem.count({ where }),
      prisma.inventoryItem.findMany({
        where,
        include: itemInclude,
        orderBy: itemOrderBy(
          "sortBy" in query ? query.sortBy : undefined,
          "sortDirection" in query ? query.sortDirection : undefined,
        ),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    let records = items.map((item) =>
      mapInventoryItemToRecord(scope, item, branchMeta, categories, recipeMappings),
    );

    if (query.status) {
      records = records.filter((record) => record.item.status === query.status);
    }

    if (query.isPerishable !== undefined) {
      records = records.filter((record) => record.item.isPerishable === query.isPerishable);
    }

    if (query.isLowStock) {
      records = records.filter((record) => record.lowStockAlerts.length > 0);
    }

    if (query.locationId) {
      records = records.filter((record) =>
        record.stocks.some((stock) => stock.locationId === query.locationId),
      );
    }

    return {
      records,
      total: query.status || query.isLowStock || query.isPerishable ? records.length : total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async findById(scope: InventoryTenantScope, itemId: string): Promise<InventoryRecord | null> {
    const [branchMeta, categories, recipeMappings] = await Promise.all([
      this.loadBranchMeta(scope),
      this.loadCategories(scope),
      this.loadRecipeMappings(scope),
    ]);

    return this.buildRecord(scope, itemId, branchMeta, categories, recipeMappings);
  }

  async listCategories(scope: InventoryTenantScope): Promise<InventoryCategory[]> {
    return this.loadCategories(scope);
  }

  async listLocations(scope: InventoryTenantScope): Promise<InventoryLocation[]> {
    const meta = await this.loadBranchMeta(scope);
    return meta.locations ?? [];
  }

  async listSuppliers(scope: InventoryTenantScope): Promise<InventorySupplier[]> {
    const suppliers = await prisma.supplier.findMany({
      where: { businessId: scope.businessId, deletedAt: null },
      orderBy: { name: "asc" },
    });

    return suppliers.map((supplier) => mapSupplier(scope, supplier));
  }

  async listPurchaseOrders(scope: InventoryTenantScope): Promise<PurchaseOrder[]> {
    const orders = await prisma.purchaseOrder.findMany({
      where: { businessId: scope.businessId, branchId: scope.branchId },
      include: purchaseOrderInclude,
      orderBy: { createdAt: "desc" },
    });

    return orders.map((order) => mapPurchaseOrder(scope, order as PurchaseOrderWithRelations));
  }

  async listRecipeMappings(scope: InventoryTenantScope): Promise<RecipeIngredientMapping[]> {
    return this.loadRecipeMappings(scope);
  }

  async createItem(
    scope: InventoryTenantScope,
    input: CreateInventoryItemInput | CreateInventoryItemSchemaInput,
  ): Promise<InventoryRecord> {
    const branchMeta = await this.loadBranchMeta(scope);
    const categories = await this.loadCategories(scope);
    const category =
      categories.find((entry) => entry.id === input.categoryId) ??
      mapStringCategory(scope, input.categoryId);
    const unitAbbreviation = input.unitId.replace(/^unit-/, "").replace(/-/g, " ") || "each";

    const existingSku = await prisma.inventoryItem.findFirst({
      where: {
        businessId: scope.businessId,
        branchId: scope.branchId,
        sku: input.sku,
        deletedAt: null,
      },
    });

    if (existingSku) {
      throw new Error("SKU already exists for this branch");
    }

    const initialQty = roundQuantity(input.initialQuantity ?? 0);
    const item = await prisma.inventoryItem.create({
      data: {
        businessId: scope.businessId,
        branchId: scope.branchId,
        sku: input.sku,
        barcode: input.barcode ?? null,
        name: input.name,
        description: input.description ?? null,
        category: category.name,
        unit: unitAbbreviation,
        currentStock: initialQty,
        minimumStock: roundQuantity(input.reorderPoint),
        maximumStock: roundQuantity(input.parLevel),
        reorderLevel: roundQuantity(input.reorderPoint),
        averageCost: roundQuantity(input.costPerUnitCents / 100),
        status: "ACTIVE",
        trackStock: true,
      },
      include: itemInclude,
    });

    branchMeta.itemMeta = {
      ...(branchMeta.itemMeta ?? {}),
      [item.id]: {
        isPerishable: input.isPerishable,
        shelfLifeDays: input.shelfLifeDays ?? null,
        parLevel: input.parLevel,
        reorderQuantity: input.reorderQuantity,
        categoryId: category.id,
        unitId: input.unitId,
      },
    };
    await this.saveBranchMeta(scope, branchMeta);

    if (initialQty > 0) {
      await applyStockChange(item.id, initialQty, {
        transactionType: "ADJUSTMENT",
        notes: "Initial stock",
        performedByStaffId: scope.userId,
      });
    }

    const recipeMappings = await this.loadRecipeMappings(scope);
    const record = mapInventoryItemToRecord(scope, item, branchMeta, categories, recipeMappings);
    return record;
  }

  async updateItem(
    scope: InventoryTenantScope,
    input: UpdateInventoryItemSchemaInput,
  ): Promise<InventoryRecord | null> {
    const existing = await prisma.inventoryItem.findFirst({
      where: { id: input.itemId, ...scopeItemWhere(scope, true) },
    });

    if (!existing) {
      return null;
    }

    const branchMeta = await this.loadBranchMeta(scope);
    const categories = await this.loadCategories(scope);
    const meta = branchMeta.itemMeta?.[existing.id] ?? {};
    const category =
      input.categoryId !== undefined
        ? (categories.find((entry) => entry.id === input.categoryId) ??
          mapStringCategory(scope, input.categoryId))
        : null;

    const item = await prisma.inventoryItem.update({
      where: { id: existing.id },
      data: {
        ...(input.sku !== undefined ? { sku: input.sku } : {}),
        ...(input.barcode !== undefined ? { barcode: input.barcode } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(category ? { category: category.name } : {}),
        ...(input.unitId !== undefined
          ? { unit: input.unitId.replace(/^unit-/, "").replace(/-/g, " ") || existing.unit }
          : {}),
        ...(input.reorderPoint !== undefined
          ? {
              minimumStock: roundQuantity(input.reorderPoint),
              reorderLevel: roundQuantity(input.reorderPoint),
            }
          : {}),
        ...(input.parLevel !== undefined ? { maximumStock: roundQuantity(input.parLevel) } : {}),
        ...(input.costPerUnitCents !== undefined
          ? { averageCost: roundQuantity(input.costPerUnitCents / 100) }
          : {}),
      },
      include: itemInclude,
    });

    branchMeta.itemMeta = {
      ...(branchMeta.itemMeta ?? {}),
      [item.id]: {
        ...meta,
        ...(input.isPerishable !== undefined ? { isPerishable: input.isPerishable } : {}),
        ...(input.shelfLifeDays !== undefined ? { shelfLifeDays: input.shelfLifeDays } : {}),
        ...(input.parLevel !== undefined ? { parLevel: input.parLevel } : {}),
        ...(input.reorderQuantity !== undefined ? { reorderQuantity: input.reorderQuantity } : {}),
        ...(category ? { categoryId: category.id } : {}),
        ...(input.unitId !== undefined ? { unitId: input.unitId } : {}),
      },
    };
    await this.saveBranchMeta(scope, branchMeta);

    const recipeMappings = await this.loadRecipeMappings(scope);
    return mapInventoryItemToRecord(scope, item, branchMeta, categories, recipeMappings);
  }

  async archiveItem(scope: InventoryTenantScope, itemId: string): Promise<InventoryRecord | null> {
    const existing = await prisma.inventoryItem.findFirst({
      where: { id: itemId, ...scopeItemWhere(scope, true) },
    });

    if (!existing) {
      return null;
    }

    await prisma.inventoryItem.update({
      where: { id: itemId },
      data: { status: "ARCHIVED", deletedAt: new Date() },
    });

    return this.findById(scope, itemId);
  }

  async restoreItem(scope: InventoryTenantScope, itemId: string): Promise<InventoryRecord | null> {
    const existing = await prisma.inventoryItem.findFirst({
      where: { id: itemId, businessId: scope.businessId, branchId: scope.branchId },
    });

    if (!existing) {
      return null;
    }

    await prisma.inventoryItem.update({
      where: { id: itemId },
      data: { status: "ACTIVE", deletedAt: null },
    });

    return this.findById(scope, itemId);
  }

  async bulkAction(
    scope: InventoryTenantScope,
    input: InventoryBulkActionSchemaInput,
  ): Promise<number> {
    let affected = 0;

    for (const itemId of input.itemIds) {
      if (input.action === "archive" || input.action === "delete") {
        const result = await this.archiveItem(scope, itemId);
        if (result) {
          affected += 1;
        }
      } else if (input.action === "restore") {
        const result = await this.restoreItem(scope, itemId);
        if (result) {
          affected += 1;
        }
      }
    }

    return affected;
  }

  async updateStock(
    scope: InventoryTenantScope,
    input: UpdateStockInput | UpdateInventoryStockSchemaInput,
  ): Promise<InventoryRecord | null> {
    const existing = await prisma.inventoryItem.findFirst({
      where: { id: input.itemId, ...scopeItemWhere(scope) },
    });

    if (!existing) {
      return null;
    }

    const transactionType =
      input.movementType === "waste"
        ? "WASTE"
        : input.movementType === "receipt"
          ? "PURCHASE"
          : input.movementType === "sale"
            ? "SALE"
            : input.movementType === "transfer_out" || input.movementType === "transfer_in"
              ? "TRANSFER"
              : input.movementType === "return"
                ? "RETURN"
                : "ADJUSTMENT";

    await applyStockChange(existing.id, roundQuantity(input.quantityDelta), {
      transactionType,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      notes: input.notes ?? null,
      performedByStaffId: scope.userId,
    });

    return this.findById(scope, input.itemId);
  }

  async recordWaste(
    scope: InventoryTenantScope,
    input: RecordWasteInput | RecordInventoryWasteSchemaInput,
  ): Promise<InventoryRecord | null> {
    return this.updateStock(scope, {
      itemId: input.itemId,
      locationId: input.locationId,
      quantityDelta: -Math.abs(input.quantity),
      movementType: "waste",
      batchId: input.batchId,
      notes: input.notes ?? `Waste: ${input.reason}`,
      employeeId: "recordedByEmployeeId" in input ? input.recordedByEmployeeId : scope.userId,
    });
  }

  async createPurchaseOrder(
    scope: InventoryTenantScope,
    input: CreatePurchaseOrderInput | CreateInventoryPurchaseOrderSchemaInput,
  ): Promise<PurchaseOrder> {
    await prisma.supplier.findFirstOrThrow({
      where: { id: input.supplierId, businessId: scope.businessId, deletedAt: null },
    });

    const count = await prisma.purchaseOrder.count({ where: { businessId: scope.businessId } });
    const poNumber = `PO-${String(count + 1).padStart(6, "0")}`;
    const lineItems = input.lineItems.map((line) => ({
      quantity: roundQuantity(line.quantity),
      unitCost: roundQuantity(line.unitCostCents / 100),
      totalCost: roundQuantity(line.quantity * (line.unitCostCents / 100)),
      inventoryItemId: line.itemId,
    }));
    const subtotal = lineItems.reduce((sum, line) => sum + line.totalCost, 0);
    const taxAmount = roundQuantity(subtotal * 0.2);

    const order = await prisma.purchaseOrder.create({
      data: {
        businessId: scope.businessId,
        branchId: scope.branchId,
        supplierId: input.supplierId,
        purchaseOrderNumber: poNumber,
        status: "DRAFT",
        expectedDeliveryDate: input.expectedDeliveryDate
          ? new Date(input.expectedDeliveryDate)
          : null,
        subtotal,
        taxAmount,
        totalAmount: roundQuantity(subtotal + taxAmount),
        notes: input.notes ?? null,
        items: {
          create: lineItems,
        },
      },
      include: purchaseOrderInclude,
    });

    return mapPurchaseOrder(scope, order as PurchaseOrderWithRelations);
  }

  async receiveGoods(
    scope: InventoryTenantScope,
    input: ReceiveInventoryGoodsSchemaInput,
  ): Promise<PurchaseOrder> {
    const order = await prisma.purchaseOrder.findFirst({
      where: {
        id: input.purchaseOrderId,
        businessId: scope.businessId,
        branchId: scope.branchId,
      },
      include: purchaseOrderInclude,
    });

    if (!order) {
      throw new Error("Purchase order not found");
    }

    if (order.status === "CANCELLED") {
      throw new Error("Cancelled purchase orders cannot be received");
    }

    if (order.status === "DRAFT") {
      await prisma.purchaseOrder.update({
        where: { id: order.id },
        data: { status: "SENT" },
      });
    }

    const branchMeta = await this.loadBranchMeta(scope);
    const grnLines: Array<{
      itemId: string;
      quantityReceived: number;
      quantityAccepted: number;
      quantityRejected: number;
      expiresAt?: string | null;
    }> = [];

    await runInteractiveTransaction(async (tx) => {
      for (const line of input.lineItems) {
        const poItem = order.items.find((item) => item.id === line.purchaseOrderLineId);
        if (!poItem) {
          throw new Error("Purchase order line not found");
        }

        const receivedQty = roundQuantity(line.quantityReceived);
        if (receivedQty <= 0) {
          continue;
        }

        const remaining = roundQuantity(Number(poItem.quantity) - Number(poItem.receivedQuantity));
        if (receivedQty > remaining) {
          throw new Error(`Received quantity exceeds remaining for ${poItem.inventoryItem.sku}`);
        }

        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: { receivedQuantity: { increment: receivedQty } },
        });

        grnLines.push({
          itemId: poItem.inventoryItemId,
          quantityReceived: receivedQty,
          quantityAccepted: roundQuantity(line.quantityAccepted ?? receivedQty),
          quantityRejected: roundQuantity(line.quantityRejected ?? 0),
          expiresAt: line.expiresAt ?? null,
        });
      }

      const refreshedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: order.id },
      });
      const allReceived = refreshedItems.every(
        (item) => Number(item.receivedQuantity) >= Number(item.quantity),
      );
      const anyReceived = refreshedItems.some((item) => Number(item.receivedQuantity) > 0);

      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: {
          status: allReceived ? "RECEIVED" : anyReceived ? "PARTIALLY_RECEIVED" : order.status,
          receivedDate: allReceived ? new Date() : order.receivedDate,
        },
      });
    });

    for (const line of grnLines) {
      await applyStockChange(line.itemId, line.quantityAccepted, {
        transactionType: "PURCHASE",
        referenceType: "PURCHASE_ORDER",
        referenceId: order.id,
        notes: `Received from ${order.purchaseOrderNumber}`,
        performedByStaffId: scope.userId,
      });

      if (line.expiresAt) {
        branchMeta.batches = [
          ...(branchMeta.batches ?? []),
          {
            id: `batch-${Date.now()}-${line.itemId}`,
            itemId: line.itemId,
            locationId: input.locationId,
            batchNumber: `B-${order.purchaseOrderNumber}`,
            quantity: line.quantityAccepted,
            receivedAt: new Date().toISOString(),
            expiresAt: line.expiresAt,
            supplierId: order.supplierId,
            costPerUnitCents: 0,
            isExpired: new Date(line.expiresAt).getTime() <= Date.now(),
            createdAt: new Date().toISOString(),
          },
        ];
      }
    }

    const mappedOrder = mapPurchaseOrder(scope, order as PurchaseOrderWithRelations);
    branchMeta.grns = [
      ...(branchMeta.grns ?? []),
      synthesizeGrnFromReceive(scope, mappedOrder, input.locationId, grnLines, input.notes),
    ];
    await this.saveBranchMeta(scope, branchMeta);

    const refreshed = await prisma.purchaseOrder.findFirstOrThrow({
      where: { id: order.id },
      include: purchaseOrderInclude,
    });

    return mapPurchaseOrder(scope, refreshed as PurchaseOrderWithRelations);
  }

  async createTransfer(
    scope: InventoryTenantScope,
    input: CreateInventoryTransferSchemaInput,
  ): Promise<InventoryRecord | null> {
    const existing = await prisma.inventoryItem.findFirst({
      where: { id: input.itemId, ...scopeItemWhere(scope) },
    });

    if (!existing) {
      return null;
    }

    const branchMeta = await this.loadBranchMeta(scope);
    const transferReference = `transfer-${Date.now()}`;

    await applyStockChange(existing.id, -roundQuantity(input.quantity), {
      transactionType: "TRANSFER",
      referenceType: "TRANSFER",
      referenceId: transferReference,
      notes: input.notes ?? `Transfer to ${input.toLocationId}`,
      performedByStaffId: scope.userId,
    });

    branchMeta.transfers = [
      ...(branchMeta.transfers ?? []),
      {
        id: transferReference,
        tenantId: scope.tenantId,
        businessId: scope.businessId,
        fromLocationId: input.fromLocationId,
        toLocationId: input.toLocationId,
        fromBranchId: scope.branchId,
        toBranchId: scope.branchId,
        status: "completed",
        lineItems: [
          {
            id: `${transferReference}-line`,
            transferId: transferReference,
            itemId: input.itemId,
            batchId: input.batchId ?? null,
            quantityRequested: input.quantity,
            quantityTransferred: input.quantity,
          },
        ],
        requestedByEmployeeId: scope.userId,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];
    await this.saveBranchMeta(scope, branchMeta);

    return this.findById(scope, input.itemId);
  }

  async getLowStockRecords(scope: InventoryTenantScope): Promise<InventoryRecord[]> {
    const records = await this.listRecords(scope);
    return records.filter((record) => record.lowStockAlerts.length > 0);
  }

  async getExpiringRecords(scope: InventoryTenantScope, withinDays = 3): Promise<InventoryRecord[]> {
    const records = await this.listRecords(scope);
    const cutoff = Date.now() + withinDays * 86_400_000;

    return records.filter((record) =>
      record.expiryTracking.some((entry) => new Date(entry.expiresAt).getTime() <= cutoff),
    );
  }
}

export const inventoryRepository = new InventoryRepository();
