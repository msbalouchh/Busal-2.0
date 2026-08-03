export const TABLE_MANAGEMENT_ROUTES = {
  overview: "/app/restaurant/tables",
  floors: "/app/restaurant/floors",
  floorPlan: "/app/restaurant/floors/plan",
  analytics: "/app/restaurant/tables/analytics",
} as const;

export const TABLE_MANAGEMENT_NAV_ITEMS = [
  { label: "Overview", href: TABLE_MANAGEMENT_ROUTES.overview },
  { label: "Floors", href: TABLE_MANAGEMENT_ROUTES.floors },
  { label: "Floor Plan", href: TABLE_MANAGEMENT_ROUTES.floorPlan },
  { label: "Analytics", href: TABLE_MANAGEMENT_ROUTES.analytics },
] as const;
