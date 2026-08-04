/** Architecture route markers (distinct from legacy inventory routes). */
export const INVENTORY_PLATFORM_ROUTES = {
  overview: "/app/restaurant/inventory",
  items: "/app/restaurant/inventory/items",
  locations: "/app/restaurant/inventory/locations",
  purchaseOrders: "/app/restaurant/inventory/purchase-orders",
  movements: "/app/restaurant/inventory/movements",
  analytics: "/app/restaurant/inventory/analytics",
} as const;

export const INVENTORY_PLATFORM_NAV_ITEMS = [
  { label: "Overview", href: INVENTORY_PLATFORM_ROUTES.overview },
  { label: "Items", href: INVENTORY_PLATFORM_ROUTES.items },
  { label: "Locations", href: INVENTORY_PLATFORM_ROUTES.locations },
  { label: "Purchase Orders", href: INVENTORY_PLATFORM_ROUTES.purchaseOrders },
  { label: "Movements", href: INVENTORY_PLATFORM_ROUTES.movements },
  { label: "Analytics", href: INVENTORY_PLATFORM_ROUTES.analytics },
] as const;
