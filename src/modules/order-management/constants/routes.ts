export const ORDER_MANAGEMENT_ROUTES = {
  list: () => `/app/restaurant/orders`,
  listForBranch: (branchId: string) => `/app/restaurant/orders?branchId=${branchId}`,
  create: (branchId: string) => `/app/restaurant/orders/new?branchId=${branchId}`,
  details: (orderId: string, branchId: string) =>
    `/app/restaurant/orders/${orderId}?branchId=${branchId}`,
  edit: (orderId: string, branchId: string) =>
    `/app/restaurant/orders/${orderId}/edit?branchId=${branchId}`,
} as const;

export const ORDER_LIST_PAGE_SIZE = 24;

export const ORDER_STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PREPARING", label: "Preparing" },
  { value: "READY", label: "Ready" },
  { value: "SERVED", label: "Served" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export const ORDER_TYPE_FILTER_OPTIONS = [
  { value: "ALL", label: "All types" },
  { value: "DINE_IN", label: "Dine-in" },
  { value: "TAKEAWAY", label: "Takeaway" },
  { value: "DELIVERY", label: "Delivery" },
] as const;

export const ORDER_TYPE_OPTIONS = [
  { value: "DINE_IN", label: "Dine-in" },
  { value: "TAKEAWAY", label: "Takeaway" },
  { value: "DELIVERY", label: "Delivery" },
] as const;

export const ORDER_PAYMENT_STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All payment statuses" },
  { value: "UNPAID", label: "Unpaid" },
  { value: "PARTIALLY_PAID", label: "Partially paid" },
  { value: "PAID", label: "Paid" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "FAILED", label: "Failed" },
] as const;

export const ORDER_SORT_OPTIONS = [
  { value: "placedAt", label: "Placed date" },
  { value: "orderNumber", label: "Order number" },
  { value: "totalAmount", label: "Total amount" },
  { value: "status", label: "Status" },
  { value: "createdAt", label: "Created date" },
] as const;

export const ACTIVE_ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "SERVED",
] as const;

export const ORDER_TIMELINE_STEPS = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "SERVED",
  "COMPLETED",
] as const;
