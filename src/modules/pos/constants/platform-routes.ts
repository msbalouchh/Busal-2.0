/** Architecture route markers (distinct from legacy POS routes). */
export const POS_PLATFORM_ROUTES = {
  terminal: "/dashboard/pos",
  registers: "/dashboard/pos",
  shifts: "/dashboard/pos",
  transactions: "/dashboard/payments",
  analytics: "/dashboard/reporting/sales",
} as const;

export const POS_PLATFORM_NAV_ITEMS = [
  { label: "Terminal", href: POS_PLATFORM_ROUTES.terminal },
  { label: "Registers", href: POS_PLATFORM_ROUTES.registers },
  { label: "Shifts", href: POS_PLATFORM_ROUTES.shifts },
  { label: "Transactions", href: POS_PLATFORM_ROUTES.transactions },
  { label: "Analytics", href: POS_PLATFORM_ROUTES.analytics },
] as const;
