/** Architecture route markers (distinct from legacy KITCHEN_ROUTES). */
export const KITCHEN_PLATFORM_ROUTES = {
  overview: "/dashboard/kitchen",
  stations: "/app/restaurant/kitchen/stations",
  queue: "/dashboard/kitchen",
  screens: "/app/restaurant/kitchen/fullscreen",
  analytics: "/app/restaurant/analytics/kitchen",
} as const;

export const KITCHEN_PLATFORM_NAV_ITEMS = [
  { label: "Overview", href: KITCHEN_PLATFORM_ROUTES.overview },
  { label: "Stations", href: KITCHEN_PLATFORM_ROUTES.stations },
  { label: "Queue", href: KITCHEN_PLATFORM_ROUTES.queue },
  { label: "Screens", href: KITCHEN_PLATFORM_ROUTES.screens },
  { label: "Analytics", href: KITCHEN_PLATFORM_ROUTES.analytics },
] as const;
