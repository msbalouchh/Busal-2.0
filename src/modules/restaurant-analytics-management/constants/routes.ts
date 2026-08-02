export const RESTAURANT_ANALYTICS_ROUTES = {
  dashboard: () => `/app/restaurant/analytics`,
  dashboardForBranch: (branchId: string, from?: string, to?: string) => {
    const params = new URLSearchParams({ branchId });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return `/app/restaurant/analytics?${params.toString()}`;
  },
  sales: (branchId?: string) =>
    branchId
      ? `/app/restaurant/analytics/sales?branchId=${branchId}`
      : `/app/restaurant/analytics/sales`,
  orders: (branchId?: string) =>
    branchId
      ? `/app/restaurant/analytics/orders?branchId=${branchId}`
      : `/app/restaurant/analytics/orders`,
  payments: (branchId?: string) =>
    branchId
      ? `/app/restaurant/analytics/payments?branchId=${branchId}`
      : `/app/restaurant/analytics/payments`,
  customers: (branchId?: string) =>
    branchId
      ? `/app/restaurant/analytics/customers?branchId=${branchId}`
      : `/app/restaurant/analytics/customers`,
  inventory: (branchId?: string) =>
    branchId
      ? `/app/restaurant/analytics/inventory?branchId=${branchId}`
      : `/app/restaurant/analytics/inventory`,
  kitchen: (branchId?: string) =>
    branchId
      ? `/app/restaurant/analytics/kitchen?branchId=${branchId}`
      : `/app/restaurant/analytics/kitchen`,
  staff: (branchId?: string) =>
    branchId
      ? `/app/restaurant/analytics/staff?branchId=${branchId}`
      : `/app/restaurant/analytics/staff`,
  reservations: (branchId?: string) =>
    branchId
      ? `/app/restaurant/analytics/reservations?branchId=${branchId}`
      : `/app/restaurant/analytics/reservations`,
  products: (branchId?: string) =>
    branchId
      ? `/app/restaurant/analytics/products?branchId=${branchId}`
      : `/app/restaurant/analytics/products`,
  reports: () => `/app/restaurant/analytics/reports`,
  reportBuilder: () => `/app/restaurant/analytics/reports/new`,
  savedReport: (reportId: string) => `/app/restaurant/analytics/reports/${reportId}`,
} as const;

export const DEFAULT_ANALYTICS_DAYS = 30;

export const REPORT_TYPE_OPTIONS = [
  { value: "SALES", label: "Sales" },
  { value: "ORDERS", label: "Orders" },
  { value: "CUSTOMERS", label: "Customers" },
  { value: "PRODUCTS", label: "Products" },
  { value: "PAYMENTS", label: "Payments" },
  { value: "RESERVATIONS", label: "Reservations" },
  { value: "INVENTORY", label: "Inventory" },
  { value: "STAFF", label: "Staff" },
  { value: "KITCHEN", label: "Kitchen" },
  { value: "CUSTOM", label: "Custom" },
] as const;

export const WIDGET_TYPE_OPTIONS = [
  { value: "KPI", label: "KPI" },
  { value: "LINE_CHART", label: "Line chart" },
  { value: "BAR_CHART", label: "Bar chart" },
  { value: "PIE_CHART", label: "Pie chart" },
  { value: "AREA_CHART", label: "Area chart" },
  { value: "TABLE", label: "Table" },
  { value: "LIST", label: "List" },
  { value: "HEATMAP", label: "Heatmap" },
] as const;

export const ANALYTICS_NAV_ITEMS = [
  { href: RESTAURANT_ANALYTICS_ROUTES.dashboard(), label: "Executive" },
  { href: RESTAURANT_ANALYTICS_ROUTES.sales(), label: "Sales" },
  { href: RESTAURANT_ANALYTICS_ROUTES.orders(), label: "Orders" },
  { href: RESTAURANT_ANALYTICS_ROUTES.payments(), label: "Payments" },
  { href: RESTAURANT_ANALYTICS_ROUTES.customers(), label: "Customers" },
  { href: RESTAURANT_ANALYTICS_ROUTES.products(), label: "Products" },
  { href: RESTAURANT_ANALYTICS_ROUTES.reservations(), label: "Reservations" },
  { href: RESTAURANT_ANALYTICS_ROUTES.kitchen(), label: "Kitchen" },
  { href: RESTAURANT_ANALYTICS_ROUTES.inventory(), label: "Inventory" },
  { href: RESTAURANT_ANALYTICS_ROUTES.staff(), label: "Staff" },
  { href: RESTAURANT_ANALYTICS_ROUTES.reports(), label: "Saved Reports" },
] as const;
