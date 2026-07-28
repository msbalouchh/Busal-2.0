export const REVOPS_ROUTES = {
  overview: "/dashboard/revops",
  invoices: "/dashboard/revops/invoices",
  payments: "/dashboard/revops/payments",
  recognition: "/dashboard/revops/recognition",
  expenses: "/dashboard/revops/expenses",
  profitability: "/dashboard/revops/profitability",
  forecasting: "/dashboard/revops/forecasting",
  analytics: "/dashboard/revops/analytics",
  collections: "/dashboard/revops/collections",
} as const;

export const REVOPS_NAV_ITEMS = [
  { label: "Dashboard", href: REVOPS_ROUTES.overview },
  { label: "Invoices", href: REVOPS_ROUTES.invoices },
  { label: "Payments", href: REVOPS_ROUTES.payments },
  { label: "Recognition", href: REVOPS_ROUTES.recognition },
  { label: "Expenses", href: REVOPS_ROUTES.expenses },
  { label: "Profitability", href: REVOPS_ROUTES.profitability },
  { label: "Forecasting", href: REVOPS_ROUTES.forecasting },
  { label: "Analytics", href: REVOPS_ROUTES.analytics },
  { label: "Collections", href: REVOPS_ROUTES.collections },
] as const;

export const REVENUE_INVOICE_STATUS_LABELS = {
  DRAFT: "Draft",
  ISSUED: "Issued",
  PARTIALLY_PAID: "Partially paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
  VOID: "Void",
  WRITTEN_OFF: "Written off",
} as const;
