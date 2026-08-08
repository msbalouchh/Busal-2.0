import type {
  IngredientCategory,
  InventoryItem as PrismaInventoryItem,
  InventoryTransaction,
  InventoryTransactionType,
  Prisma,
  PurchaseOrder as PrismaPurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  Recipe,
  RecipeLine,
  Supplier,
} from "@prisma/client";

import {
  GRN_STATUSES,
  INVENTORY_LOCATION_TYPES,
  INVENTORY_MOVEMENT_TYPES,
  INVENTORY_STOCK_STATUSES,
  INVENTORY_UNIT_TYPES,
  PURCHASE_ORDER_STATUSES,
  type InventoryMovementType,
  type InventoryStockStatus,
  type PurchaseOrderStatus as DomainPurchaseOrderStatus,
} from "@/modules/inventory/constants/inventory-status";
import type { InventoryTenantScope } from "@/modules/inventory/lib/inventory-scope";
import type {
  ExpiryTracking,
  GoodsReceivedNote,
  InventoryAiContext,
  InventoryAnalytics,
  InventoryBatch,
  InventoryCategory,
  InventoryItem,
  InventoryLocation,
  InventoryRecord,
  InventoryStock,
  InventorySupplier,
  InventoryUnit,
  LowStockAlert,
  PurchaseOrder,
  PurchaseOrderLineItem,
  RecipeIngredientMapping,
  StockAdjustment,
  StockMovement,
  StockTransfer,
  WasteRecord,
} from "@/modules/inventory/types/inventory-platform";

export interface StoredItemMeta {
  isPerishable?: boolean;
  shelfLifeDays?: number | null;
  parLevel?: number;
  reorderQuantity?: number;
  categoryId?: string;
  unitId?: string;
}

export interface StoredInventoryBranchMeta {
  locations?: InventoryLocation[];
  batches?: InventoryBatch[];
  grns?: GoodsReceivedNote[];
  transfers?: StockTransfer[];
  itemMeta?: Record<string, StoredItemMeta>;
}

export type InventoryItemWithRelations = PrismaInventoryItem & {
  transactions?: InventoryTransaction[];
};

export type PurchaseOrderWithRelations = PrismaPurchaseOrder & {
  items: Array<
    PurchaseOrderItem & {
      inventoryItem: Pick<PrismaInventoryItem, "id" | "name" | "sku">;
    }
  >;
  supplier: Pick<Supplier, "id" | "name">;
};

export type RecipeWithRelations = Recipe & {
  lines: Array<
    RecipeLine & {
      ingredient: Pick<Prisma.IngredientGetPayload<object>, "id" | "name">;
    }
  >;
  menuItem: Pick<Prisma.MenuItemGetPayload<object>, "id" | "name">;
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function decimal(value: Prisma.Decimal | number | string): number {
  return Number(value);
}

function cents(value: Prisma.Decimal | number | string): number {
  return Math.round(decimal(value) * 100);
}

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function categoryIdFromName(name: string): string {
  return `cat-${slugify(name || "uncategorized")}`;
}

export function unitIdFromAbbreviation(unit: string): string {
  return `unit-${slugify(unit || "each")}`;
}

export function resolveStockStatus(
  quantity: number,
  reorderPoint: number,
): InventoryStockStatus {
  if (quantity <= 0) {
    return INVENTORY_STOCK_STATUSES.OUT_OF_STOCK;
  }

  if (quantity <= reorderPoint) {
    return INVENTORY_STOCK_STATUSES.LOW_STOCK;
  }

  return INVENTORY_STOCK_STATUSES.IN_STOCK;
}

export function mapPrismaPoStatus(status: PurchaseOrderStatus): DomainPurchaseOrderStatus {
  switch (status) {
    case "SENT":
      return PURCHASE_ORDER_STATUSES.ORDERED;
    case "PARTIALLY_RECEIVED":
      return PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED;
    case "RECEIVED":
      return PURCHASE_ORDER_STATUSES.RECEIVED;
    case "CANCELLED":
      return PURCHASE_ORDER_STATUSES.CANCELLED;
    case "DRAFT":
    default:
      return PURCHASE_ORDER_STATUSES.DRAFT;
  }
}

export function mapDomainPoStatus(status: DomainPurchaseOrderStatus): PurchaseOrderStatus {
  switch (status) {
    case PURCHASE_ORDER_STATUSES.ORDERED:
    case PURCHASE_ORDER_STATUSES.SUBMITTED:
    case PURCHASE_ORDER_STATUSES.APPROVED:
      return "SENT";
    case PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED:
      return "PARTIALLY_RECEIVED";
    case PURCHASE_ORDER_STATUSES.RECEIVED:
      return "RECEIVED";
    case PURCHASE_ORDER_STATUSES.CANCELLED:
      return "CANCELLED";
    case PURCHASE_ORDER_STATUSES.DRAFT:
    default:
      return "DRAFT";
  }
}

export function mapTransactionType(type: InventoryTransactionType): InventoryMovementType {
  switch (type) {
    case "PURCHASE":
      return INVENTORY_MOVEMENT_TYPES.RECEIPT;
    case "SALE":
      return INVENTORY_MOVEMENT_TYPES.SALE;
    case "TRANSFER":
      return INVENTORY_MOVEMENT_TYPES.TRANSFER_OUT;
    case "WASTE":
      return INVENTORY_MOVEMENT_TYPES.WASTE;
    case "RETURN":
      return INVENTORY_MOVEMENT_TYPES.RETURN;
    case "ADJUSTMENT":
    default:
      return INVENTORY_MOVEMENT_TYPES.ADJUSTMENT;
  }
}

export function mapIngredientCategory(
  scope: InventoryTenantScope,
  category: IngredientCategory,
): InventoryCategory {
  return {
    id: category.id,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    name: category.name,
    slug: category.slug,
    parentId: null,
    displayOrder: category.sortOrder,
    isActive: true,
    createdAt: iso(category.createdAt),
    updatedAt: iso(category.updatedAt),
  };
}

export function mapStringCategory(scope: InventoryTenantScope, name: string): InventoryCategory {
  const slug = slugify(name);
  const now = new Date().toISOString();

  return {
    id: categoryIdFromName(name),
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    name,
    slug,
    parentId: null,
    displayOrder: 99,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function mapUnit(scope: InventoryTenantScope, unit: string): InventoryUnit {
  const normalized = unit.toLowerCase();
  const unitType =
    normalized in INVENTORY_UNIT_TYPES
      ? INVENTORY_UNIT_TYPES[normalized as keyof typeof INVENTORY_UNIT_TYPES]
      : INVENTORY_UNIT_TYPES.EACH;

  return {
    id: unitIdFromAbbreviation(unit),
    tenantId: scope.tenantId,
    name: unit,
    unitType,
    abbreviation: unit,
    conversionFactor: 1,
    baseUnitId: null,
  };
}

export function defaultBranchInventoryMeta(scope: InventoryTenantScope): StoredInventoryBranchMeta {
  const now = new Date().toISOString();

  return {
    locations: [
      {
        id: scope.defaultLocationId,
        tenantId: scope.tenantId,
        businessId: scope.businessId,
        branchId: scope.branchId,
        name: "Main Store",
        code: "MAIN",
        locationType: INVENTORY_LOCATION_TYPES.KITCHEN,
        isWarehouse: false,
        isActive: true,
        address: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: `${scope.branchId}-loc-warehouse`,
        tenantId: scope.tenantId,
        businessId: scope.businessId,
        branchId: scope.branchId,
        name: "Warehouse",
        code: "WH-01",
        locationType: INVENTORY_LOCATION_TYPES.WAREHOUSE,
        isWarehouse: true,
        isActive: true,
        address: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    batches: [],
    grns: [],
    transfers: [],
    itemMeta: {},
  };
}

export function mapSupplier(
  scope: InventoryTenantScope,
  supplier: Supplier,
  itemIds: string[] = [],
): InventorySupplier {
  return {
    id: supplier.id,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    name: supplier.name,
    code: slugify(supplier.name).slice(0, 12).toUpperCase(),
    contactEmail: supplier.email,
    contactPhone: supplier.phone,
    leadTimeDays: 3,
    minimumOrderCents: 0,
    currency: "GBP",
    isActive: supplier.status === "ACTIVE",
    itemIds,
    createdAt: iso(supplier.createdAt),
    updatedAt: iso(supplier.updatedAt),
  };
}

export function mapPurchaseOrder(
  scope: InventoryTenantScope,
  order: PurchaseOrderWithRelations,
): PurchaseOrder {
  return {
    id: order.id,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: order.branchId,
    supplierId: order.supplierId,
    poNumber: order.purchaseOrderNumber,
    status: mapPrismaPoStatus(order.status),
    orderDate: iso(order.createdAt),
    expectedDeliveryDate: order.expectedDeliveryDate
      ? iso(order.expectedDeliveryDate)
      : null,
    subtotalCents: cents(order.subtotal),
    taxCents: cents(order.taxAmount),
    totalCents: cents(order.totalAmount),
    currency: "GBP",
    lineItems: order.items.map(
      (line): PurchaseOrderLineItem => ({
        id: line.id,
        purchaseOrderId: line.purchaseOrderId,
        itemId: line.inventoryItemId,
        itemName: line.inventoryItem.name,
        quantityOrdered: decimal(line.quantity),
        quantityReceived: decimal(line.receivedQuantity),
        unitCostCents: cents(line.unitCost),
        totalCostCents: cents(line.totalCost),
      }),
    ),
    notes: order.notes,
    createdByEmployeeId: scope.userId,
    createdAt: iso(order.createdAt),
    updatedAt: iso(order.updatedAt),
  };
}

export function mapTransactionToMovement(
  scope: InventoryTenantScope,
  itemId: string,
  locationId: string,
  transaction: InventoryTransaction,
): StockMovement {
  const quantity = decimal(transaction.quantity);

  return {
    id: transaction.id,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    itemId,
    locationId,
    batchId: null,
    movementType: mapTransactionType(transaction.transactionType),
    quantity,
    referenceType: transaction.referenceType,
    referenceId: transaction.referenceId,
    notes: transaction.notes,
    employeeId: transaction.performedByStaffId ?? scope.userId,
    occurredAt: iso(transaction.createdAt),
  };
}

export function mapTransactionToAdjustment(
  scope: InventoryTenantScope,
  itemId: string,
  locationId: string,
  transaction: InventoryTransaction,
  quantityBefore: number,
): StockAdjustment {
  const quantityAfter = quantityBefore + decimal(transaction.quantity);

  return {
    id: transaction.id,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    itemId,
    locationId,
    batchId: null,
    reason: "count_correction",
    quantityBefore,
    quantityAfter,
    adjustmentQuantity: decimal(transaction.quantity),
    notes: transaction.notes,
    adjustedByEmployeeId: transaction.performedByStaffId ?? scope.userId,
    adjustedAt: iso(transaction.createdAt),
  };
}

export function mapTransactionToWaste(
  scope: InventoryTenantScope,
  itemId: string,
  locationId: string,
  transaction: InventoryTransaction,
  costPerUnitCents: number,
): WasteRecord {
  const quantity = Math.abs(decimal(transaction.quantity));

  return {
    id: transaction.id,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    itemId,
    locationId,
    batchId: null,
    reason: "other",
    quantity,
    costCents: Math.round(costPerUnitCents * quantity),
    notes: transaction.notes,
    recordedByEmployeeId: transaction.performedByStaffId ?? scope.userId,
    recordedAt: iso(transaction.createdAt),
  };
}

export function buildLowStockAlert(
  scope: InventoryTenantScope,
  item: InventoryItem,
  stock: InventoryStock,
): LowStockAlert {
  return {
    id: createId("alert"),
    itemId: item.id,
    locationId: stock.locationId,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    currentQuantity: stock.quantityOnHand,
    reorderPoint: item.reorderPoint,
    suggestedReorderQuantity: item.reorderQuantity,
    severity:
      stock.quantityOnHand <= 0 ? "critical" : ("warning" as const),
    isAcknowledged: false,
    acknowledgedAt: null,
    createdAt: new Date().toISOString(),
  };
}

export function buildExpiryTracking(
  batches: InventoryBatch[],
): ExpiryTracking[] {
  const now = Date.now();

  return batches
    .filter((batch) => batch.expiresAt)
    .map((batch) => {
      const expiresAt = batch.expiresAt!;
      const daysUntilExpiry = Math.ceil(
        (new Date(expiresAt).getTime() - now) / 86_400_000,
      );
      const status =
        daysUntilExpiry <= 0
          ? ("expired" as const)
          : daysUntilExpiry <= 3
            ? ("approaching" as const)
            : ("ok" as const);

      return {
        id: createId("exp"),
        itemId: batch.itemId,
        batchId: batch.id,
        locationId: batch.locationId,
        expiresAt,
        daysUntilExpiry,
        quantity: batch.quantity,
        status,
        actionTaken: null,
      };
    });
}

export function buildAnalytics(
  item: InventoryItem,
  stockQuantity: number,
  wasteRecords: WasteRecord[],
  movements: StockMovement[],
): InventoryAnalytics {
  const wasteCost = wasteRecords.reduce((sum, record) => sum + record.costCents, 0);
  const totalValueCents = item.costPerUnitCents * stockQuantity;
  const saleMovements = movements.filter((movement) => movement.movementType === "sale");
  const turnoverRate = saleMovements.length > 0 ? Math.min(7, saleMovements.length) : 1;

  return {
    itemId: item.id,
    turnoverRate,
    daysOfSupply: stockQuantity > 0 ? Math.max(1, Math.round(stockQuantity / Math.max(turnoverRate, 1))) : 0,
    wasteRateBps: totalValueCents > 0 ? Math.round((wasteCost / totalValueCents) * 10_000) : 0,
    stockoutCount: item.status === INVENTORY_STOCK_STATUSES.OUT_OF_STOCK ? 1 : 0,
    avgCostPerUnitCents: item.costPerUnitCents,
    totalValueCents,
    reorderFrequencyDays: 7,
  };
}

export function buildAiContext(
  item: InventoryItem,
  analytics: InventoryAnalytics,
  expiryTracking: ExpiryTracking[],
): InventoryAiContext {
  const expiryRisk = expiryTracking.some((entry) => entry.status !== "ok") ? 0.75 : 0.2;

  return {
    itemId: item.id,
    summary: `${item.name} (${item.sku})`,
    demandForecastUnits: Math.max(item.reorderQuantity, analytics.turnoverRate * 7),
    suggestedReorderQuantity: item.reorderQuantity,
    wasteRiskScore: analytics.wasteRateBps / 10_000,
    stockOptimizationScore:
      item.status === INVENTORY_STOCK_STATUSES.IN_STOCK
        ? 0.8
        : item.status === INVENTORY_STOCK_STATUSES.LOW_STOCK
          ? 0.45
          : 0.2,
    insights: [
      `Current status: ${item.status}`,
      expiryTracking.length > 0 ? `${expiryTracking.length} batch(es) tracked` : "No expiry batches",
    ],
    recommendedActions:
      item.status === INVENTORY_STOCK_STATUSES.LOW_STOCK
        ? ["Create purchase order", "Review par level"]
        : [],
    lastGeneratedAt: new Date().toISOString(),
    ...(expiryRisk > 0.5 ? { expiryRiskScore: expiryRisk } : {}),
  } as InventoryAiContext;
}

export function mapRecipeMappings(recipes: RecipeWithRelations[]): RecipeIngredientMapping[] {
  return recipes.flatMap((recipe) =>
    recipe.lines.map((line) => ({
      id: line.id,
      tenantId: recipe.businessId,
      businessId: recipe.businessId,
      menuItemId: recipe.menuItemId,
      menuItemName: recipe.menuItem.name,
      ingredientItemId: line.ingredientId,
      ingredientName: line.ingredient.name,
      quantityRequired: decimal(line.quantity),
      unitId: unitIdFromAbbreviation(line.unit),
      wastageBps: Math.round(decimal(line.wastePercent) * 100),
      isActive: true,
    })),
  );
}

export function mapInventoryItemToRecord(
  scope: InventoryTenantScope,
  item: InventoryItemWithRelations,
  branchMeta: StoredInventoryBranchMeta,
  categories: InventoryCategory[],
  recipeMappings: RecipeIngredientMapping[],
): InventoryRecord {
  const meta = branchMeta.itemMeta?.[item.id] ?? {};
  const categoryName = item.category ?? "Uncategorized";
  const category =
    categories.find((entry) => entry.id === meta.categoryId) ??
    categories.find((entry) => entry.slug === slugify(categoryName)) ??
    mapStringCategory(scope, categoryName);
  const unit = mapUnit(scope, item.unit);
  const reorderPoint = decimal(item.reorderLevel ?? item.minimumStock);
  const reorderQuantity = meta.reorderQuantity ?? decimal(item.maximumStock ?? reorderPoint * 2);
  const parLevel = meta.parLevel ?? decimal(item.maximumStock ?? reorderQuantity);
  const quantityOnHand = decimal(item.currentStock);
  const status = resolveStockStatus(quantityOnHand, reorderPoint);
  const locationId = scope.defaultLocationId;
  const costPerUnitCents = cents(item.averageCost);

  const domainItem: InventoryItem = {
    id: item.id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    categoryId: category.id,
    unitId: unit.id,
    sku: item.sku,
    barcode: item.barcode,
    name: item.name,
    description: item.description,
    status,
    reorderPoint,
    reorderQuantity,
    parLevel,
    costPerUnitCents,
    currency: "GBP",
    isPerishable: meta.isPerishable ?? false,
    shelfLifeDays: meta.shelfLifeDays ?? null,
    isActive: item.status === "ACTIVE" && item.deletedAt === null,
    createdAt: iso(item.createdAt),
    updatedAt: iso(item.updatedAt),
  };

  const stock: InventoryStock = {
    id: `${item.id}-${locationId}`,
    itemId: item.id,
    locationId,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    quantityOnHand,
    quantityReserved: 0,
    quantityAvailable: quantityOnHand,
    status,
    lastCountedAt: null,
    updatedAt: iso(item.updatedAt),
  };

  const batches = (branchMeta.batches ?? []).filter((batch) => batch.itemId === item.id);
  const transactions = item.transactions ?? [];
  const movements = transactions.map((transaction) =>
    mapTransactionToMovement(scope, item.id, locationId, transaction),
  );
  const adjustments = transactions
    .filter((transaction) => transaction.transactionType === "ADJUSTMENT")
    .map((transaction, index) =>
      mapTransactionToAdjustment(
        scope,
        item.id,
        locationId,
        transaction,
        Math.max(0, quantityOnHand - decimal(transaction.quantity) * (index + 1)),
      ),
    );
  const wasteRecords = transactions
    .filter((transaction) => transaction.transactionType === "WASTE")
    .map((transaction) =>
      mapTransactionToWaste(scope, item.id, locationId, transaction, costPerUnitCents),
    );
  const expiryTracking = buildExpiryTracking(batches);
  const analytics = buildAnalytics(domainItem, quantityOnHand, wasteRecords, movements);
  const aiContext = buildAiContext(domainItem, analytics, expiryTracking);
  const lowStockAlerts =
    status === INVENTORY_STOCK_STATUSES.LOW_STOCK ||
    status === INVENTORY_STOCK_STATUSES.OUT_OF_STOCK
      ? [buildLowStockAlert(scope, domainItem, stock)]
      : [];

  return {
    item: domainItem,
    category,
    unit,
    stocks: [stock],
    batches,
    movements,
    adjustments,
    recipeMappings: recipeMappings.filter((mapping) => mapping.ingredientItemId === item.id),
    lowStockAlerts,
    wasteRecords,
    expiryTracking,
    analytics,
    aiContext,
  };
}

export function synthesizeGrnFromReceive(
  scope: InventoryTenantScope,
  purchaseOrder: PurchaseOrder,
  locationId: string,
  lineItems: Array<{
    itemId: string;
    quantityReceived: number;
    quantityAccepted: number;
    quantityRejected: number;
    expiresAt?: string | null;
  }>,
  notes?: string | null,
): GoodsReceivedNote {
  const now = new Date().toISOString();

  return {
    id: createId("grn"),
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    purchaseOrderId: purchaseOrder.id,
    grnNumber: `GRN-${purchaseOrder.poNumber}`,
    status: GRN_STATUSES.ACCEPTED,
    receivedAt: now,
    receivedByEmployeeId: scope.userId,
    locationId,
    lineItems: lineItems.map((line) => ({
      id: createId("grn-line"),
      grnId: createId("grn"),
      itemId: line.itemId,
      batchId: null,
      quantityReceived: line.quantityReceived,
      quantityAccepted: line.quantityAccepted,
      quantityRejected: line.quantityRejected,
      expiresAt: line.expiresAt ?? null,
    })),
    notes: notes ?? null,
    createdAt: now,
  };
}
