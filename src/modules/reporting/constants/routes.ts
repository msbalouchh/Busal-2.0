export const REPORTING_ROUTES = {
  overview: "/dashboard/reporting",
  sales: "/dashboard/reporting/sales",
  orders: "/dashboard/reporting/orders",
  products: "/dashboard/reporting/products",
  customers: "/dashboard/reporting/customers",
  inventory: "/dashboard/reporting/inventory",
  staff: "/dashboard/reporting/staff",
  financial: "/dashboard/reporting/financial",
  export: "/api/reporting/export",
} as const;

export const REPORTING_NAV_ITEMS = [
  { label: "Overview", href: REPORTING_ROUTES.overview },
  { label: "Sales", href: REPORTING_ROUTES.sales },
  { label: "Orders", href: REPORTING_ROUTES.orders },
  { label: "Products", href: REPORTING_ROUTES.products },
  { label: "Customers", href: REPORTING_ROUTES.customers },
  { label: "Inventory", href: REPORTING_ROUTES.inventory },
  { label: "Staff", href: REPORTING_ROUTES.staff },
  { label: "Financial", href: REPORTING_ROUTES.financial },
] as const;

export const REPORTING_FUTURE_FEATURES = {
  aiInsights: "aiInsights",
  forecasting: "forecasting",
  scheduledReports: "scheduledReports",
  emailReports: "emailReports",
  multiBranchReporting: "multiBranchReporting",
} as const;

export type ReportingExportFormat = "csv" | "excel" | "pdf";

export type ReportingExportReportType =
  "sales" | "orders" | "products" | "customers" | "inventory" | "staff" | "financial";
