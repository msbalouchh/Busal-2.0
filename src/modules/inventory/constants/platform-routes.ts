/** Architecture route markers (distinct from legacy inventory routes). */
export const INVENTORY_PLATFORM_ROUTES = {
  overview: "/dashboard/inventory",
  items: "/dashboard/inventory/ingredients",
  locations: "/dashboard/inventory",
  purchaseOrders: "/app/restaurant/inventory/purchase-orders",
  movements: "/dashboard/inventory/movements",
  analytics: "/dashboard/reporting/inventory",
} as const;

export const INVENTORY_PLATFORM_NAV_ITEMS = [
  { label: "Overview", href: INVENTORY_PLATFORM_ROUTES.overview },
  { label: "Items", href: INVENTORY_PLATFORM_ROUTES.items },
  { label: "Locations", href: INVENTORY_PLATFORM_ROUTES.locations },
  { label: "Purchase Orders", href: INVENTORY_PLATFORM_ROUTES.purchaseOrders },
  { label: "Movements", href: INVENTORY_PLATFORM_ROUTES.movements },
  { label: "Analytics", href: INVENTORY_PLATFORM_ROUTES.analytics },
] as const;
