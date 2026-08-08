import type {
  GrnStatus,
  InventoryLocationType,
  InventoryMovementType,
  InventoryStockStatus,
  InventoryUnitType,
  PurchaseOrderStatus,
  StockAdjustmentReason,
  WasteReason,
} from "@/modules/inventory/constants/inventory-status";

/** Product category for inventory grouping. */
export interface InventoryCategory {
  id: string;
  tenantId: string;
  businessId: string;
  name: string;
  slug: string;
  parentId: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Standard unit of measure definition. */
export interface InventoryUnit {
  id: string;
  tenantId: string;
  name: string;
  unitType: InventoryUnitType;
  abbreviation: string;
  conversionFactor: number;
  baseUnitId: string | null;
}

/** Master inventory item (ingredient, supply, retail product). */
export interface InventoryItem {
  id: string;
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  categoryId: string;
  unitId: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  status: InventoryStockStatus;
  reorderPoint: number;
  reorderQuantity: number;
  parLevel: number;
  costPerUnitCents: number;
  currency: string;
  isPerishable: boolean;
  shelfLifeDays: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Stock level for an item at a location. */
export interface InventoryStock {
  id: string;
  itemId: string;
  locationId: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  status: InventoryStockStatus;
  lastCountedAt: string | null;
  updatedAt: string;
}

/** Batch/lot tracking for traceability and expiry. */
export interface InventoryBatch {
  id: string;
  itemId: string;
  locationId: string;
  batchNumber: string;
  quantity: number;
  receivedAt: string;
  expiresAt: string | null;
  supplierId: string | null;
  costPerUnitCents: number;
  isExpired: boolean;
  createdAt: string;
}

/** Physical or logical storage location. */
export interface InventoryLocation {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  name: string;
  code: string;
  locationType: InventoryLocationType;
  isWarehouse: boolean;
  isActive: boolean;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Supplier/vendor for purchasing. */
export interface InventorySupplier {
  id: string;
  tenantId: string;
  businessId: string;
  name: string;
  code: string;
  contactEmail: string | null;
  contactPhone: string | null;
  leadTimeDays: number;
  minimumOrderCents: number;
  currency: string;
  isActive: boolean;
  itemIds: string[];
  createdAt: string;
  updatedAt: string;
}

/** Purchase order to supplier. */
export interface PurchaseOrder {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  supplierId: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDeliveryDate: string | null;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  lineItems: PurchaseOrderLineItem[];
  notes: string | null;
  createdByEmployeeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderLineItem {
  id: string;
  purchaseOrderId: string;
  itemId: string;
  itemName: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCostCents: number;
  totalCostCents: number;
}

/** Goods Received Note against a purchase order. */
export interface GoodsReceivedNote {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  purchaseOrderId: string;
  grnNumber: string;
  status: GrnStatus;
  receivedAt: string;
  receivedByEmployeeId: string;
  locationId: string;
  lineItems: GrnLineItem[];
  notes: string | null;
  createdAt: string;
}

export interface GrnLineItem {
  id: string;
  grnId: string;
  itemId: string;
  batchId: string | null;
  quantityReceived: number;
  quantityAccepted: number;
  quantityRejected: number;
  expiresAt: string | null;
}

/** Stock movement ledger entry. */
export interface StockMovement {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  itemId: string;
  locationId: string;
  batchId: string | null;
  movementType: InventoryMovementType;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  employeeId: string;
  occurredAt: string;
}

/** Manual stock count adjustment. */
export interface StockAdjustment {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  itemId: string;
  locationId: string;
  batchId: string | null;
  reason: StockAdjustmentReason;
  quantityBefore: number;
  quantityAfter: number;
  adjustmentQuantity: number;
  notes: string | null;
  adjustedByEmployeeId: string;
  adjustedAt: string;
}

/** Inter-location stock transfer. */
export interface StockTransfer {
  id: string;
  tenantId: string;
  businessId: string;
  fromLocationId: string;
  toLocationId: string;
  fromBranchId: string;
  toBranchId: string;
  status: "pending" | "in_transit" | "completed" | "cancelled";
  lineItems: StockTransferLineItem[];
  requestedByEmployeeId: string;
  completedAt: string | null;
  createdAt: string;
}

export interface StockTransferLineItem {
  id: string;
  transferId: string;
  itemId: string;
  batchId: string | null;
  quantityRequested: number;
  quantityTransferred: number;
}

/** Maps menu recipe to inventory ingredients for auto-deduction. */
export interface RecipeIngredientMapping {
  id: string;
  tenantId: string;
  businessId: string;
  menuItemId: string;
  menuItemName: string;
  ingredientItemId: string;
  ingredientName: string;
  quantityRequired: number;
  unitId: string;
  wastageBps: number;
  isActive: boolean;
}

/** Alert when stock falls below reorder point. */
export interface LowStockAlert {
  id: string;
  itemId: string;
  locationId: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  currentQuantity: number;
  reorderPoint: number;
  suggestedReorderQuantity: number;
  severity: "warning" | "critical";
  isAcknowledged: boolean;
  acknowledgedAt: string | null;
  createdAt: string;
}

/** Waste/spoilage record. */
export interface WasteRecord {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  itemId: string;
  locationId: string;
  batchId: string | null;
  reason: WasteReason;
  quantity: number;
  costCents: number;
  notes: string | null;
  recordedByEmployeeId: string;
  recordedAt: string;
}

/** Expiry tracking for perishable batches. */
export interface ExpiryTracking {
  id: string;
  itemId: string;
  batchId: string;
  locationId: string;
  expiresAt: string;
  daysUntilExpiry: number;
  quantity: number;
  status: "ok" | "approaching" | "expired";
  actionTaken: string | null;
}

/** Performance and cost metrics. */
export interface InventoryAnalytics {
  itemId: string;
  turnoverRate: number;
  daysOfSupply: number;
  wasteRateBps: number;
  stockoutCount: number;
  avgCostPerUnitCents: number;
  totalValueCents: number;
  reorderFrequencyDays: number;
}

/** AI-enriched context for inventory intelligence. */
export interface InventoryAiContext {
  itemId: string;
  summary: string;
  demandForecastUnits: number;
  suggestedReorderQuantity: number;
  wasteRiskScore: number;
  stockOptimizationScore: number;
  insights: string[];
  recommendedActions: string[];
  lastGeneratedAt: string;
}

/** Full inventory item aggregate — single source of truth. */
export interface InventoryRecord {
  item: InventoryItem;
  category: InventoryCategory;
  unit: InventoryUnit;
  stocks: InventoryStock[];
  batches: InventoryBatch[];
  movements: StockMovement[];
  adjustments: StockAdjustment[];
  recipeMappings: RecipeIngredientMapping[];
  lowStockAlerts: LowStockAlert[];
  wasteRecords: WasteRecord[];
  expiryTracking: ExpiryTracking[];
  analytics: InventoryAnalytics;
  aiContext: InventoryAiContext;
}

export interface InventorySearchQuery {
  query?: string;
  tenantId?: string;
  businessId?: string;
  branchId?: string;
  categoryId?: string;
  locationId?: string;
  status?: InventoryStockStatus;
  supplierId?: string;
  isPerishable?: boolean;
  isLowStock?: boolean;
  limit?: number;
}

export interface CreateInventoryItemInput {
  branchId: string;
  categoryId: string;
  unitId: string;
  sku: string;
  name: string;
  description?: string;
  reorderPoint: number;
  reorderQuantity: number;
  parLevel: number;
  costPerUnitCents: number;
  isPerishable?: boolean;
  shelfLifeDays?: number;
  barcode?: string;
  initialQuantity?: number;
  locationId?: string;
}

export interface UpdateStockInput {
  itemId: string;
  locationId: string;
  quantityDelta: number;
  movementType: InventoryMovementType;
  batchId?: string;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  employeeId: string;
}

export interface RecordWasteInput {
  itemId: string;
  locationId: string;
  batchId?: string;
  reason: WasteReason;
  quantity: number;
  notes?: string;
  recordedByEmployeeId: string;
}

export interface CreatePurchaseOrderInput {
  branchId: string;
  supplierId: string;
  expectedDeliveryDate?: string;
  lineItems: Array<{ itemId: string; quantity: number; unitCostCents: number }>;
  notes?: string;
  createdByEmployeeId: string;
}

export interface InventoryPlatformContext {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
  defaultLocationId: string;
}

export interface InventoryContextValue {
  context: InventoryPlatformContext;
  records: InventoryRecord[];
  categories: InventoryCategory[];
  locations: InventoryLocation[];
  suppliers: InventorySupplier[];
  purchaseOrders: PurchaseOrder[];
  selectedItemId: string | null;
  selectedItem: InventoryRecord | null;
  selectItem: (itemId: string | null) => void;
  searchItems: (query: InventorySearchQuery) => InventoryRecord[];
  refresh: () => void;
  isRefreshing: boolean;
  error: string | null;
}

export interface InventoryStockContextValue {
  location: InventoryLocation | null;
  records: InventoryRecord[];
  lowStockCount: number;
  refresh: () => void;
}

export interface InventoryPurchaseContextValue {
  purchaseOrders: PurchaseOrder[];
  suppliers: InventorySupplier[];
  pendingOrderCount: number;
  refresh: () => void;
}
