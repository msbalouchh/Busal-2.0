import {
  INVENTORY_LOCATION_TYPES,
  INVENTORY_STOCK_STATUSES,
  INVENTORY_UNIT_TYPES,
  PURCHASE_ORDER_STATUSES,
} from "@/modules/inventory/constants/inventory-status";
import type {
  InventoryBatch,
  InventoryCategory,
  InventoryItem,
  InventoryLocation,
  InventoryRecord,
  InventoryStock,
  InventorySupplier,
  InventoryUnit,
  PurchaseOrder,
  RecipeIngredientMapping,
} from "@/modules/inventory/types/inventory-platform";

export const DEFAULT_INVENTORY_SCOPE = {
  tenantId: "tenant-harbour",
  workspaceId: "ws-harbour-kitchen",
  businessId: "biz-harbour-kitchen",
  branchId: "branch-harbour-main",
  userId: "user-harbour-owner",
  defaultLocationId: "loc-kitchen-main",
  employeeId: "emp-manager-1",
} as const;

const NOW = "2026-02-15T20:00:00.000Z";

export const MOCK_INVENTORY_CATEGORIES: InventoryCategory[] = [
  {
    id: "cat-proteins",
    tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
    businessId: DEFAULT_INVENTORY_SCOPE.businessId,
    name: "Proteins",
    slug: "proteins",
    parentId: null,
    displayOrder: 1,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "cat-produce",
    tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
    businessId: DEFAULT_INVENTORY_SCOPE.businessId,
    name: "Produce",
    slug: "produce",
    parentId: null,
    displayOrder: 2,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "cat-dry-goods",
    tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
    businessId: DEFAULT_INVENTORY_SCOPE.businessId,
    name: "Dry Goods",
    slug: "dry-goods",
    parentId: null,
    displayOrder: 3,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "cat-beverages",
    tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
    businessId: DEFAULT_INVENTORY_SCOPE.businessId,
    name: "Beverages",
    slug: "beverages",
    parentId: null,
    displayOrder: 4,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const MOCK_INVENTORY_UNITS: InventoryUnit[] = [
  {
    id: "unit-kg",
    tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
    name: "Kilogram",
    unitType: INVENTORY_UNIT_TYPES.KG,
    abbreviation: "kg",
    conversionFactor: 1,
    baseUnitId: null,
  },
  {
    id: "unit-each",
    tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
    name: "Each",
    unitType: INVENTORY_UNIT_TYPES.EACH,
    abbreviation: "ea",
    conversionFactor: 1,
    baseUnitId: null,
  },
  {
    id: "unit-l",
    tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
    name: "Litre",
    unitType: INVENTORY_UNIT_TYPES.L,
    abbreviation: "L",
    conversionFactor: 1,
    baseUnitId: null,
  },
  {
    id: "unit-bottle",
    tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
    name: "Bottle",
    unitType: INVENTORY_UNIT_TYPES.BOTTLE,
    abbreviation: "btl",
    conversionFactor: 1,
    baseUnitId: null,
  },
];

export const MOCK_INVENTORY_LOCATIONS: InventoryLocation[] = [
  {
    id: "loc-kitchen-main",
    tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
    businessId: DEFAULT_INVENTORY_SCOPE.businessId,
    branchId: DEFAULT_INVENTORY_SCOPE.branchId,
    name: "Main Kitchen Store",
    code: "KITCH-01",
    locationType: INVENTORY_LOCATION_TYPES.KITCHEN,
    isWarehouse: false,
    isActive: true,
    address: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "loc-warehouse",
    tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
    businessId: DEFAULT_INVENTORY_SCOPE.businessId,
    branchId: DEFAULT_INVENTORY_SCOPE.branchId,
    name: "Central Warehouse",
    code: "WH-01",
    locationType: INVENTORY_LOCATION_TYPES.WAREHOUSE,
    isWarehouse: true,
    isActive: true,
    address: "Unit 4, Harbour Industrial Estate",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "loc-cold-storage",
    tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
    businessId: DEFAULT_INVENTORY_SCOPE.businessId,
    branchId: DEFAULT_INVENTORY_SCOPE.branchId,
    name: "Cold Storage",
    code: "COLD-01",
    locationType: INVENTORY_LOCATION_TYPES.COLD_STORAGE,
    isWarehouse: false,
    isActive: true,
    address: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "loc-bar",
    tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
    businessId: DEFAULT_INVENTORY_SCOPE.businessId,
    branchId: DEFAULT_INVENTORY_SCOPE.branchId,
    name: "Bar Store",
    code: "BAR-01",
    locationType: INVENTORY_LOCATION_TYPES.BAR,
    isWarehouse: false,
    isActive: true,
    address: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const MOCK_INVENTORY_SUPPLIERS: InventorySupplier[] = [
  {
    id: "supplier-meat-co",
    tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
    businessId: DEFAULT_INVENTORY_SCOPE.businessId,
    name: "Harbour Meat Co.",
    code: "SUP-001",
    contactEmail: "orders@harbourmeat.co.uk",
    contactPhone: "+44 20 7946 0958",
    leadTimeDays: 2,
    minimumOrderCents: 15000,
    currency: "GBP",
    isActive: true,
    itemIds: ["inv-ribeye", "inv-chicken"],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "supplier-fresh-produce",
    tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
    businessId: DEFAULT_INVENTORY_SCOPE.businessId,
    name: "Fresh Fields Produce",
    code: "SUP-002",
    contactEmail: "sales@freshfields.co.uk",
    contactPhone: "+44 20 7946 0123",
    leadTimeDays: 1,
    minimumOrderCents: 5000,
    currency: "GBP",
    isActive: true,
    itemIds: ["inv-romaine", "inv-tomatoes"],
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "po-001",
    tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
    businessId: DEFAULT_INVENTORY_SCOPE.businessId,
    branchId: DEFAULT_INVENTORY_SCOPE.branchId,
    supplierId: "supplier-meat-co",
    poNumber: "PO-2026-0042",
    status: PURCHASE_ORDER_STATUSES.ORDERED,
    orderDate: "2026-02-14T09:00:00.000Z",
    expectedDeliveryDate: "2026-02-16T08:00:00.000Z",
    subtotalCents: 28500,
    taxCents: 5700,
    totalCents: 34200,
    currency: "GBP",
    lineItems: [
      {
        id: "po-line-1",
        purchaseOrderId: "po-001",
        itemId: "inv-ribeye",
        itemName: "Ribeye Steak",
        quantityOrdered: 20,
        quantityReceived: 0,
        unitCostCents: 1200,
        totalCostCents: 24000,
      },
      {
        id: "po-line-2",
        purchaseOrderId: "po-001",
        itemId: "inv-chicken",
        itemName: "Free-range Chicken Breast",
        quantityOrdered: 15,
        quantityReceived: 0,
        unitCostCents: 300,
        totalCostCents: 4500,
      },
    ],
    notes: "Weekly protein restock",
    createdByEmployeeId: DEFAULT_INVENTORY_SCOPE.employeeId,
    createdAt: "2026-02-14T09:00:00.000Z",
    updatedAt: NOW,
  },
];

function buildRecord(partial: {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  unitId: string;
  status: (typeof INVENTORY_STOCK_STATUSES)[keyof typeof INVENTORY_STOCK_STATUSES];
  quantityOnHand: number;
  reorderPoint: number;
  reorderQuantity: number;
  costPerUnitCents: number;
  isPerishable?: boolean;
  shelfLifeDays?: number;
  locationId?: string;
  hasExpiry?: boolean;
  hasWaste?: boolean;
  menuItemId?: string;
}): InventoryRecord {
  const locationId = partial.locationId ?? DEFAULT_INVENTORY_SCOPE.defaultLocationId;
  const category = MOCK_INVENTORY_CATEGORIES.find((c) => c.id === partial.categoryId)!;
  const unit = MOCK_INVENTORY_UNITS.find((u) => u.id === partial.unitId)!;
  const quantityAvailable = Math.max(0, partial.quantityOnHand);

  const item: InventoryItem = {
    id: partial.id,
    tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
    workspaceId: DEFAULT_INVENTORY_SCOPE.workspaceId,
    businessId: DEFAULT_INVENTORY_SCOPE.businessId,
    branchId: DEFAULT_INVENTORY_SCOPE.branchId,
    categoryId: partial.categoryId,
    unitId: partial.unitId,
    sku: partial.sku,
    barcode: `890${partial.sku.replace(/-/g, "")}`,
    name: partial.name,
    description: null,
    status: partial.status,
    reorderPoint: partial.reorderPoint,
    reorderQuantity: partial.reorderQuantity,
    parLevel: partial.reorderPoint * 2,
    costPerUnitCents: partial.costPerUnitCents,
    currency: "GBP",
    isPerishable: partial.isPerishable ?? false,
    shelfLifeDays: partial.shelfLifeDays ?? null,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  };

  const stocks: InventoryStock[] = [
    {
      id: `stock-${partial.id}`,
      itemId: partial.id,
      locationId,
      tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
      businessId: DEFAULT_INVENTORY_SCOPE.businessId,
      branchId: DEFAULT_INVENTORY_SCOPE.branchId,
      quantityOnHand: partial.quantityOnHand,
      quantityReserved: partial.status === INVENTORY_STOCK_STATUSES.RESERVED ? 2 : 0,
      quantityAvailable,
      status: partial.status,
      lastCountedAt: "2026-02-15T06:00:00.000Z",
      updatedAt: NOW,
    },
  ];

  const batches: InventoryBatch[] = partial.isPerishable
    ? [
        {
          id: `batch-${partial.id}`,
          itemId: partial.id,
          locationId,
          batchNumber: `LOT-${partial.sku.toUpperCase()}-001`,
          quantity: partial.quantityOnHand,
          receivedAt: "2026-02-13T08:00:00.000Z",
          expiresAt: partial.hasExpiry ? "2026-02-14T23:59:00.000Z" : "2026-02-20T23:59:00.000Z",
          supplierId: "supplier-meat-co",
          costPerUnitCents: partial.costPerUnitCents,
          isExpired: partial.status === INVENTORY_STOCK_STATUSES.EXPIRED,
          createdAt: "2026-02-13T08:00:00.000Z",
        },
      ]
    : [];

  const recipeMappings: RecipeIngredientMapping[] = partial.menuItemId
    ? [
        {
          id: `recipe-${partial.id}`,
          tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
          businessId: DEFAULT_INVENTORY_SCOPE.businessId,
          menuItemId: partial.menuItemId,
          menuItemName: partial.menuItemId === "menu-ribeye" ? "Ribeye Steak" : partial.name,
          ingredientItemId: partial.id,
          ingredientName: partial.name,
          quantityRequired: partial.unitId === "unit-kg" ? 0.35 : 1,
          unitId: partial.unitId,
          wastageBps: 500,
          isActive: true,
        },
      ]
    : [];

  const isLowStock = partial.quantityOnHand <= partial.reorderPoint;

  return {
    item,
    category,
    unit,
    stocks,
    batches,
    movements: [
      {
        id: `mov-${partial.id}-receipt`,
        tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
        businessId: DEFAULT_INVENTORY_SCOPE.businessId,
        branchId: DEFAULT_INVENTORY_SCOPE.branchId,
        itemId: partial.id,
        locationId,
        batchId: batches[0]?.id ?? null,
        movementType: "receipt",
        quantity: partial.quantityOnHand + 5,
        referenceType: "grn",
        referenceId: "grn-001",
        notes: "Initial stock receipt",
        employeeId: DEFAULT_INVENTORY_SCOPE.employeeId,
        occurredAt: "2026-02-13T08:00:00.000Z",
      },
    ],
    adjustments: [],
    recipeMappings,
    lowStockAlerts: isLowStock
      ? [
          {
            id: `alert-${partial.id}`,
            itemId: partial.id,
            locationId,
            tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
            businessId: DEFAULT_INVENTORY_SCOPE.businessId,
            branchId: DEFAULT_INVENTORY_SCOPE.branchId,
            currentQuantity: partial.quantityOnHand,
            reorderPoint: partial.reorderPoint,
            suggestedReorderQuantity: partial.reorderQuantity,
            severity: partial.quantityOnHand === 0 ? "critical" : "warning",
            isAcknowledged: false,
            acknowledgedAt: null,
            createdAt: NOW,
          },
        ]
      : [],
    wasteRecords: partial.hasWaste
      ? [
          {
            id: `waste-${partial.id}`,
            tenantId: DEFAULT_INVENTORY_SCOPE.tenantId,
            businessId: DEFAULT_INVENTORY_SCOPE.businessId,
            branchId: DEFAULT_INVENTORY_SCOPE.branchId,
            itemId: partial.id,
            locationId,
            batchId: batches[0]?.id ?? null,
            reason: "expired",
            quantity: 2,
            costCents: partial.costPerUnitCents * 2,
            notes: "Batch expired before use",
            recordedByEmployeeId: DEFAULT_INVENTORY_SCOPE.employeeId,
            recordedAt: NOW,
          },
        ]
      : [],
    expiryTracking: partial.isPerishable
      ? [
          {
            id: `expiry-${partial.id}`,
            itemId: partial.id,
            batchId: batches[0]?.id ?? "",
            locationId,
            expiresAt: batches[0]?.expiresAt ?? NOW,
            daysUntilExpiry: partial.hasExpiry ? -1 : 5,
            quantity: partial.quantityOnHand,
            status: partial.hasExpiry
              ? "expired"
              : partial.status === INVENTORY_STOCK_STATUSES.LOW_STOCK
                ? "approaching"
                : "ok",
            actionTaken: partial.hasExpiry ? "Marked for waste" : null,
          },
        ]
      : [],
    analytics: {
      itemId: partial.id,
      turnoverRate: 4.2,
      daysOfSupply: isLowStock ? 1.5 : 8,
      wasteRateBps: partial.hasWaste ? 800 : 200,
      stockoutCount: partial.status === INVENTORY_STOCK_STATUSES.OUT_OF_STOCK ? 2 : 0,
      avgCostPerUnitCents: partial.costPerUnitCents,
      totalValueCents: partial.costPerUnitCents * partial.quantityOnHand,
      reorderFrequencyDays: 7,
    },
    aiContext: {
      itemId: partial.id,
      summary: `${partial.name} (${partial.sku}) — ${partial.quantityOnHand} ${unit.abbreviation}`,
      demandForecastUnits: partial.reorderQuantity,
      suggestedReorderQuantity: partial.reorderQuantity,
      wasteRiskScore: partial.hasWaste ? 0.75 : partial.isPerishable ? 0.35 : 0.1,
      stockOptimizationScore: isLowStock ? 0.4 : 0.85,
      insights: isLowStock
        ? [`Below reorder point (${partial.reorderPoint} ${unit.abbreviation})`]
        : [],
      recommendedActions: isLowStock
        ? [`Create PO for ${partial.reorderQuantity} ${unit.abbreviation}`]
        : [],
      lastGeneratedAt: NOW,
    },
  };
}

export const MOCK_INVENTORY_RECORDS: InventoryRecord[] = [
  buildRecord({
    id: "inv-ribeye",
    sku: "PROT-RIB-001",
    name: "Ribeye Steak",
    categoryId: "cat-proteins",
    unitId: "unit-kg",
    status: INVENTORY_STOCK_STATUSES.IN_STOCK,
    quantityOnHand: 18,
    reorderPoint: 10,
    reorderQuantity: 20,
    costPerUnitCents: 1200,
    isPerishable: true,
    shelfLifeDays: 7,
    menuItemId: "menu-ribeye",
  }),
  buildRecord({
    id: "inv-romaine",
    sku: "PROD-ROM-001",
    name: "Romaine Lettuce",
    categoryId: "cat-produce",
    unitId: "unit-each",
    status: INVENTORY_STOCK_STATUSES.LOW_STOCK,
    quantityOnHand: 4,
    reorderPoint: 12,
    reorderQuantity: 24,
    costPerUnitCents: 180,
    isPerishable: true,
    shelfLifeDays: 5,
    locationId: "loc-cold-storage",
    menuItemId: "menu-caesar",
  }),
  buildRecord({
    id: "inv-olive-oil",
    sku: "DRY-OIL-001",
    name: "Extra Virgin Olive Oil",
    categoryId: "cat-dry-goods",
    unitId: "unit-l",
    status: INVENTORY_STOCK_STATUSES.IN_STOCK,
    quantityOnHand: 12,
    reorderPoint: 4,
    reorderQuantity: 6,
    costPerUnitCents: 850,
    locationId: "loc-warehouse",
  }),
  buildRecord({
    id: "inv-house-red",
    sku: "BEV-WIN-001",
    name: "House Red Wine",
    categoryId: "cat-beverages",
    unitId: "unit-bottle",
    status: INVENTORY_STOCK_STATUSES.RESERVED,
    quantityOnHand: 24,
    reorderPoint: 12,
    reorderQuantity: 36,
    costPerUnitCents: 650,
    locationId: "loc-bar",
  }),
  buildRecord({
    id: "inv-chicken",
    sku: "PROT-CHK-001",
    name: "Free-range Chicken Breast",
    categoryId: "cat-proteins",
    unitId: "unit-kg",
    status: INVENTORY_STOCK_STATUSES.OUT_OF_STOCK,
    quantityOnHand: 0,
    reorderPoint: 8,
    reorderQuantity: 15,
    costPerUnitCents: 300,
    isPerishable: true,
    shelfLifeDays: 4,
    locationId: "loc-cold-storage",
  }),
  buildRecord({
    id: "inv-cream",
    sku: "PROD-CRM-001",
    name: "Double Cream",
    categoryId: "cat-produce",
    unitId: "unit-l",
    status: INVENTORY_STOCK_STATUSES.EXPIRED,
    quantityOnHand: 3,
    reorderPoint: 6,
    reorderQuantity: 10,
    costPerUnitCents: 320,
    isPerishable: true,
    shelfLifeDays: 7,
    locationId: "loc-cold-storage",
    hasExpiry: true,
    hasWaste: true,
  }),
];

export const MOCK_RECIPE_MAPPINGS: RecipeIngredientMapping[] = MOCK_INVENTORY_RECORDS.flatMap(
  (r) => r.recipeMappings,
);
