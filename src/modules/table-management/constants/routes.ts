export const TABLE_MANAGEMENT_ROUTES = {
  overview: "/dashboard/tables",
  floors: "/app/restaurant/floors",
  floorPlan: "/app/restaurant/floors",
  analytics: "/dashboard/tables",
} as const;

export const TABLE_MANAGEMENT_NAV_ITEMS = [
  { label: "Overview", href: TABLE_MANAGEMENT_ROUTES.overview },
  { label: "Floors", href: TABLE_MANAGEMENT_ROUTES.floors },
  { label: "Floor Plan", href: TABLE_MANAGEMENT_ROUTES.floorPlan },
  { label: "Analytics", href: TABLE_MANAGEMENT_ROUTES.analytics },
] as const;
