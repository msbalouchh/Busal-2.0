import {
  INVENTORY_STOCK_STATUSES,
  PURCHASE_ORDER_STATUSES,
} from "@/modules/inventory/constants/inventory-status";
import {
  DEFAULT_INVENTORY_SCOPE,
  MOCK_INVENTORY_CATEGORIES,
  MOCK_INVENTORY_LOCATIONS,
  MOCK_INVENTORY_RECORDS,
  MOCK_INVENTORY_SUPPLIERS,
  MOCK_PURCHASE_ORDERS,
} from "@/modules/inventory/constants/mock-data";
import type {
  CreateInventoryItemInput,
  CreatePurchaseOrderInput,
  InventoryCategory,
  InventoryLocation,
  InventoryRecord,
  InventorySearchQuery,
  InventorySupplier,
  PurchaseOrder,
  RecordWasteInput,
  UpdateStockInput,
} from "@/modules/inventory/types/inventory-platform";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function resolveStockStatus(
  quantity: number,
  reorderPoint: number,
): InventoryRecord["item"]["status"] {
  if (quantity <= 0) {
    return INVENTORY_STOCK_STATUSES.OUT_OF_STOCK;
  }

  if (quantity <= reorderPoint) {
    return INVENTORY_STOCK_STATUSES.LOW_STOCK;
  }

  return INVENTORY_STOCK_STATUSES.IN_STOCK;
}

/** In-memory inventory repository (mock only, no backend). */
export class InventoryRepository {
  private records: InventoryRecord[] = structuredClone(MOCK_INVENTORY_RECORDS);
  private categories: InventoryCategory[] = structuredClone(MOCK_INVENTORY_CATEGORIES);
  private locations: InventoryLocation[] = structuredClone(MOCK_INVENTORY_LOCATIONS);
  private suppliers: InventorySupplier[] = structuredClone(MOCK_INVENTORY_SUPPLIERS);
  private purchaseOrders: PurchaseOrder[] = structuredClone(MOCK_PURCHASE_ORDERS);

  listRecords(): InventoryRecord[] {
    return structuredClone(this.records);
  }

  listCategories(): InventoryCategory[] {
    return structuredClone(this.categories);
  }

  listLocations(): InventoryLocation[] {
    return structuredClone(this.locations);
  }

  listSuppliers(): InventorySupplier[] {
    return structuredClone(this.suppliers);
  }

  listPurchaseOrders(): PurchaseOrder[] {
    return structuredClone(this.purchaseOrders);
  }

  findById(itemId: string): InventoryRecord | undefined {
    return this.records.find((record) => record.item.id === itemId);
  }

  search(query: InventorySearchQuery = {}): InventoryRecord[] {
    let results = this.listRecords();

    if (query.tenantId) {
      results = results.filter((r) => r.item.tenantId === query.tenantId);
    }

    if (query.businessId) {
      results = results.filter((r) => r.item.businessId === query.businessId);
    }

    if (query.branchId) {
      results = results.filter((r) => r.item.branchId === query.branchId);
    }

    if (query.categoryId) {
      results = results.filter((r) => r.item.categoryId === query.categoryId);
    }

    if (query.locationId) {
      results = results.filter((r) => r.stocks.some((s) => s.locationId === query.locationId));
    }

    if (query.status) {
      results = results.filter((r) => r.item.status === query.status);
    }

    if (query.isPerishable !== undefined) {
      results = results.filter((r) => r.item.isPerishable === query.isPerishable);
    }

    if (query.isLowStock) {
      results = results.filter((r) =>
        r.stocks.some((s) => s.quantityOnHand <= r.item.reorderPoint),
      );
    }

    if (query.query) {
      const term = query.query.toLowerCase();
      results = results.filter(
        (r) =>
          r.item.name.toLowerCase().includes(term) ||
          r.item.sku.toLowerCase().includes(term) ||
          (r.item.barcode?.toLowerCase().includes(term) ?? false),
      );
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  createItem(input: CreateInventoryItemInput): InventoryRecord {
    const now = new Date().toISOString();
    const itemId = createId("inv");
    const locationId = input.locationId ?? DEFAULT_INVENTORY_SCOPE.defaultLocationId;
    const initialQty = input.initialQuantity ?? 0;
    const category = this.categories.find((c) => c.id === input.categoryId)!;
    const unit = { id: input.unitId, abbreviation: "ea" };

    const record: InventoryRecord = {
      item: {
        id: itemId,
        tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
        workspaceId: DEFAULT_INVENTORY_SCOPE.workspaceId,
        businessId: DEFAULT_INVENTORY_SCOPE.businessId,
        branchId: input.branchId,
        categoryId: input.categoryId,
        unitId: input.unitId,
        sku: input.sku,
        barcode: input.barcode ?? null,
        name: input.name,
        description: input.description ?? null,
        status: resolveStockStatus(initialQty, input.reorderPoint),
        reorderPoint: input.reorderPoint,
        reorderQuantity: input.reorderQuantity,
        parLevel: input.parLevel,
        costPerUnitCents: input.costPerUnitCents,
        currency: "GBP",
        isPerishable: input.isPerishable ?? false,
        shelfLifeDays: input.shelfLifeDays ?? null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      category,
      unit: {
        id: input.unitId,
        tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
        name: unit.abbreviation,
        unitType: "each",
        abbreviation: unit.abbreviation,
        conversionFactor: 1,
        baseUnitId: null,
      },
      stocks: [
        {
          id: createId("stock"),
          itemId,
          locationId,
          tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
          businessId: DEFAULT_INVENTORY_SCOPE.businessId,
          branchId: input.branchId,
          quantityOnHand: initialQty,
          quantityReserved: 0,
          quantityAvailable: initialQty,
          status: resolveStockStatus(initialQty, input.reorderPoint),
          lastCountedAt: null,
          updatedAt: now,
        },
      ],
      batches: [],
      movements: [],
      adjustments: [],
      recipeMappings: [],
      lowStockAlerts: [],
      wasteRecords: [],
      expiryTracking: [],
      analytics: {
        itemId,
        turnoverRate: 0,
        daysOfSupply: 0,
        wasteRateBps: 0,
        stockoutCount: 0,
        avgCostPerUnitCents: input.costPerUnitCents,
        totalValueCents: input.costPerUnitCents * initialQty,
        reorderFrequencyDays: 7,
      },
      aiContext: {
        itemId,
        summary: `${input.name} (${input.sku})`,
        demandForecastUnits: input.reorderQuantity,
        suggestedReorderQuantity: input.reorderQuantity,
        wasteRiskScore: 0,
        stockOptimizationScore: 0.5,
        insights: [],
        recommendedActions: [],
        lastGeneratedAt: now,
      },
    };

    this.records.push(record);
    return structuredClone(record);
  }

  updateStock(input: UpdateStockInput): InventoryRecord | null {
    const record = this.findById(input.itemId);

    if (!record) {
      return null;
    }

    const now = new Date().toISOString();
    const stock = record.stocks.find((s) => s.locationId === input.locationId);

    if (!stock) {
      return null;
    }

    const quantityBefore = stock.quantityOnHand;
    stock.quantityOnHand = Math.max(0, quantityBefore + input.quantityDelta);
    stock.quantityAvailable = Math.max(0, stock.quantityOnHand - stock.quantityReserved);
    stock.status = resolveStockStatus(stock.quantityOnHand, record.item.reorderPoint);
    stock.updatedAt = now;

    record.item.status = stock.status;
    record.item.updatedAt = now;

    record.movements.push({
      id: createId("mov"),
      tenantId: record.item.tenantId,
      businessId: record.item.businessId,
      branchId: record.item.branchId,
      itemId: input.itemId,
      locationId: input.locationId,
      batchId: input.batchId ?? null,
      movementType: input.movementType,
      quantity: input.quantityDelta,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      notes: input.notes ?? null,
      employeeId: input.employeeId,
      occurredAt: now,
    });

    record.analytics.totalValueCents = record.item.costPerUnitCents * stock.quantityOnHand;

    return structuredClone(record);
  }

  recordWaste(input: RecordWasteInput): InventoryRecord | null {
    const record = this.findById(input.itemId);

    if (!record) {
      return null;
    }

    const now = new Date().toISOString();
    const costCents = record.item.costPerUnitCents * input.quantity;

    record.wasteRecords.push({
      id: createId("waste"),
      tenantId: record.item.tenantId,
      businessId: record.item.businessId,
      branchId: record.item.branchId,
      itemId: input.itemId,
      locationId: input.locationId,
      batchId: input.batchId ?? null,
      reason: input.reason,
      quantity: input.quantity,
      costCents,
      notes: input.notes ?? null,
      recordedByEmployeeId: input.recordedByEmployeeId,
      recordedAt: now,
    });

    this.updateStock({
      itemId: input.itemId,
      locationId: input.locationId,
      quantityDelta: -input.quantity,
      movementType: "waste",
      batchId: input.batchId,
      notes: input.notes,
      employeeId: input.recordedByEmployeeId,
    });

    return structuredClone(record);
  }

  createPurchaseOrder(input: CreatePurchaseOrderInput): PurchaseOrder {
    const now = new Date().toISOString();
    const poId = createId("po");
    const poNumber = `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    const lineItems = input.lineItems.map((line) => {
      const itemRecord = this.findById(line.itemId);
      return {
        id: createId("po-line"),
        purchaseOrderId: poId,
        itemId: line.itemId,
        itemName: itemRecord?.item.name ?? "Unknown Item",
        quantityOrdered: line.quantity,
        quantityReceived: 0,
        unitCostCents: line.unitCostCents,
        totalCostCents: line.quantity * line.unitCostCents,
      };
    });

    const subtotalCents = lineItems.reduce((sum, l) => sum + l.totalCostCents, 0);
    const taxCents = Math.round(subtotalCents * 0.2);

    const po: PurchaseOrder = {
      id: poId,
      tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
      businessId: DEFAULT_INVENTORY_SCOPE.businessId,
      branchId: input.branchId,
      supplierId: input.supplierId,
      poNumber,
      status: PURCHASE_ORDER_STATUSES.DRAFT,
      orderDate: now,
      expectedDeliveryDate: input.expectedDeliveryDate ?? null,
      subtotalCents,
      taxCents,
      totalCents: subtotalCents + taxCents,
      currency: "GBP",
      lineItems,
      notes: input.notes ?? null,
      createdByEmployeeId: input.createdByEmployeeId,
      createdAt: now,
      updatedAt: now,
    };

    this.purchaseOrders.push(po);
    return structuredClone(po);
  }

  getLowStockRecords(): InventoryRecord[] {
    return this.records.filter((r) =>
      r.stocks.some((s) => s.quantityOnHand <= r.item.reorderPoint),
    );
  }

  getExpiringRecords(withinDays = 3): InventoryRecord[] {
    const cutoff = Date.now() + withinDays * 86_400_000;

    return this.records.filter((r) =>
      r.expiryTracking.some((e) => new Date(e.expiresAt).getTime() <= cutoff),
    );
  }
}

export const inventoryRepository = new InventoryRepository();
