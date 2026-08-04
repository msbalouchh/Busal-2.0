/** Architecture route markers (distinct from legacy POS routes). */
export const POS_PLATFORM_ROUTES = {
  terminal: "/app/restaurant/pos",
  registers: "/app/restaurant/pos/registers",
  shifts: "/app/restaurant/pos/shifts",
  transactions: "/app/restaurant/pos/transactions",
  analytics: "/app/restaurant/pos/analytics",
} as const;

export const POS_PLATFORM_NAV_ITEMS = [
  { label: "Terminal", href: POS_PLATFORM_ROUTES.terminal },
  { label: "Registers", href: POS_PLATFORM_ROUTES.registers },
  { label: "Shifts", href: POS_PLATFORM_ROUTES.shifts },
  { label: "Transactions", href: POS_PLATFORM_ROUTES.transactions },
  { label: "Analytics", href: POS_PLATFORM_ROUTES.analytics },
] as const;
