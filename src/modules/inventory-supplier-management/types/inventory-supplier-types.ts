import type {
  InventoryStatus,
  InventoryTransactionType,
  PurchaseOrderStatus,
  SupplierStatus,
} from "@prisma/client";

export interface InventoryItemRecord {
  id: string;
  businessId: string;
  branchId: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  category: string | null;
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number | null;
  reorderLevel: number | null;
  averageCost: number;
  status: InventoryStatus;
  trackStock: boolean;
  isLowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierRecord {
  id: string;
  businessId: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  status: SupplierStatus;
  purchaseOrderCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItemRecord {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  inventoryItemSku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQuantity: number;
}

export interface PurchaseOrderRecord {
  id: string;
  businessId: string;
  branchId: string;
  supplierId: string;
  supplierName: string;
  purchaseOrderNumber: string;
  status: PurchaseOrderStatus;
  expectedDeliveryDate: string | null;
  receivedDate: string | null;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  items: PurchaseOrderItemRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransactionRecord {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  inventoryItemSku: string;
  transactionType: InventoryTransactionType;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  performedByStaffId: string | null;
  performedByName: string | null;
  createdAt: string;
}

export interface InventoryDashboardStats {
  totalItems: number;
  activeItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockValue: number;
  openPurchaseOrders: number;
}

export interface InventoryListQuery {
  branchId: string;
  search?: string;
  status?: InventoryStatus | "ALL";
  category?: string;
  lowStockOnly?: boolean;
  sortBy?: "name" | "sku" | "currentStock" | "updatedAt";
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface InventoryListResult {
  items: InventoryItemRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SupplierListQuery {
  search?: string;
  status?: SupplierStatus | "ALL";
  page?: number;
  pageSize?: number;
}

export interface SupplierListResult {
  items: SupplierRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PurchaseOrderListQuery {
  branchId: string;
  search?: string;
  status?: PurchaseOrderStatus | "ALL";
  supplierId?: string;
  page?: number;
  pageSize?: number;
}

export interface PurchaseOrderListResult {
  items: PurchaseOrderRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface InventoryItemInput {
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  unit?: string;
  minimumStock?: number;
  maximumStock?: number | null;
  reorderLevel?: number | null;
  averageCost?: number;
  status?: InventoryStatus;
  trackStock?: boolean;
  initialStock?: number;
}

export interface SupplierInput {
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  notes?: string | null;
  status?: SupplierStatus;
}

export interface PurchaseOrderItemInput {
  inventoryItemId: string;
  quantity: number;
  unitCost: number;
}

export interface PurchaseOrderInput {
  branchId: string;
  supplierId: string;
  expectedDeliveryDate?: string | null;
  taxAmount?: number;
  notes?: string | null;
  items: PurchaseOrderItemInput[];
}

export interface StockAdjustmentInput {
  inventoryItemId: string;
  branchId: string;
  quantity: number;
  notes?: string | null;
}

export interface StockTransferInput {
  sourceItemId: string;
  targetItemId: string;
  branchId: string;
  quantity: number;
  notes?: string | null;
}

export interface ReceiveStockInput {
  purchaseOrderId: string;
  branchId: string;
  lines: Array<{ purchaseOrderItemId: string; receivedQuantity: number }>;
}

export interface InventoryHistoryQuery {
  branchId: string;
  inventoryItemId?: string;
  transactionType?: InventoryTransactionType | "ALL";
  page?: number;
  pageSize?: number;
}

export interface InventoryHistoryResult {
  items: InventoryTransactionRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
