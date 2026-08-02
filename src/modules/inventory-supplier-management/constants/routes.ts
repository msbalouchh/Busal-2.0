export const INVENTORY_SUPPLIER_ROUTES = {
  dashboard: () => `/app/restaurant/inventory`,
  dashboardForBranch: (branchId: string) => `/app/restaurant/inventory?branchId=${branchId}`,
  createItem: (branchId: string) => `/app/restaurant/inventory/items/new?branchId=${branchId}`,
  item: (itemId: string, branchId: string) =>
    `/app/restaurant/inventory/items/${itemId}?branchId=${branchId}`,
  editItem: (itemId: string, branchId: string) =>
    `/app/restaurant/inventory/items/${itemId}/edit?branchId=${branchId}`,
  suppliers: (branchId?: string) =>
    branchId
      ? `/app/restaurant/inventory/suppliers?branchId=${branchId}`
      : `/app/restaurant/inventory/suppliers`,
  createSupplier: () => `/app/restaurant/inventory/suppliers/new`,
  supplier: (supplierId: string) => `/app/restaurant/inventory/suppliers/${supplierId}`,
  purchaseOrders: (branchId?: string) =>
    branchId
      ? `/app/restaurant/inventory/purchase-orders?branchId=${branchId}`
      : `/app/restaurant/inventory/purchase-orders`,
  createPurchaseOrder: (branchId: string) =>
    `/app/restaurant/inventory/purchase-orders/new?branchId=${branchId}`,
  purchaseOrder: (purchaseOrderId: string, branchId: string) =>
    `/app/restaurant/inventory/purchase-orders/${purchaseOrderId}?branchId=${branchId}`,
  lowStock: (branchId?: string) =>
    branchId
      ? `/app/restaurant/inventory?branchId=${branchId}&lowStockOnly=true`
      : `/app/restaurant/inventory?lowStockOnly=true`,
  history: (branchId?: string) =>
    branchId
      ? `/app/restaurant/inventory/history?branchId=${branchId}`
      : `/app/restaurant/inventory/history`,
} as const;

export const INVENTORY_LIST_PAGE_SIZE = 24;
export const SUPPLIER_LIST_PAGE_SIZE = 24;
export const PURCHASE_ORDER_LIST_PAGE_SIZE = 20;

export const INVENTORY_STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

export const PURCHASE_ORDER_STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "PARTIALLY_RECEIVED", label: "Partially received" },
  { value: "RECEIVED", label: "Received" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export const INVENTORY_SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "sku", label: "SKU" },
  { value: "currentStock", label: "Stock level" },
  { value: "updatedAt", label: "Recently updated" },
] as const;
