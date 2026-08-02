export const QR_ORDERING_ROUTES = {
  dashboard: () => `/app/restaurant/qr-ordering`,
  dashboardForBranch: (branchId: string) => `/app/restaurant/qr-ordering?branchId=${branchId}`,
  printSheet: (branchId: string) => `/app/restaurant/qr-ordering/print?branchId=${branchId}`,
} as const;

export const QR_PUBLIC_ROUTES = {
  entry: (tableToken: string) => `/qr/${tableToken}`,
  menu: (tableToken: string) => `/qr/${tableToken}`,
  cart: (tableToken: string) => `/qr/${tableToken}/cart`,
  checkout: (tableToken: string) => `/qr/${tableToken}/checkout`,
  orders: (tableToken: string) => `/qr/${tableToken}/orders`,
  orderTracking: (tableToken: string, orderId: string) => `/qr/${tableToken}/orders/${orderId}`,
} as const;

export const QR_SESSION_COOKIE = "busal_qr_session" as const;

export const QR_CART_STORAGE_KEY = "busal_qr_cart" as const;

export function getQrCartStorageKey(tableToken: string): string {
  return `${QR_CART_STORAGE_KEY}:${tableToken}`;
}

export const QR_STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

export const QR_ORDER_REFRESH_INTERVAL_MS = 10_000;
