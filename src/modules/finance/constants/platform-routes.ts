/** Architecture route markers for the Finance platform. */
export const FINANCE_PLATFORM_ROUTES = {
  overview: "/dashboard/reporting/financial",
  ledger: "/dashboard/reporting/financial",
  invoices: "/dashboard/payments",
  expenses: "/app/ai/finance/expenses",
  reports: "/dashboard/reporting/financial",
  cashFlow: "/app/ai/finance/cash-flow",
} as const;

export const FINANCE_PLATFORM_NAV_ITEMS = [
  { label: "Overview", href: FINANCE_PLATFORM_ROUTES.overview },
  { label: "Ledger", href: FINANCE_PLATFORM_ROUTES.ledger },
  { label: "Invoices", href: FINANCE_PLATFORM_ROUTES.invoices },
  { label: "Expenses", href: FINANCE_PLATFORM_ROUTES.expenses },
  { label: "Reports", href: FINANCE_PLATFORM_ROUTES.reports },
  { label: "Cash Flow", href: FINANCE_PLATFORM_ROUTES.cashFlow },
] as const;
