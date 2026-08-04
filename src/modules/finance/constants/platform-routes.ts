/** Architecture route markers for the Finance platform. */
export const FINANCE_PLATFORM_ROUTES = {
  overview: "/app/restaurant/finance",
  ledger: "/app/restaurant/finance/ledger",
  invoices: "/app/restaurant/finance/invoices",
  expenses: "/app/restaurant/finance/expenses",
  reports: "/app/restaurant/finance/reports",
  cashFlow: "/app/restaurant/finance/cash-flow",
} as const;

export const FINANCE_PLATFORM_NAV_ITEMS = [
  { label: "Overview", href: FINANCE_PLATFORM_ROUTES.overview },
  { label: "Ledger", href: FINANCE_PLATFORM_ROUTES.ledger },
  { label: "Invoices", href: FINANCE_PLATFORM_ROUTES.invoices },
  { label: "Expenses", href: FINANCE_PLATFORM_ROUTES.expenses },
  { label: "Reports", href: FINANCE_PLATFORM_ROUTES.reports },
  { label: "Cash Flow", href: FINANCE_PLATFORM_ROUTES.cashFlow },
] as const;
