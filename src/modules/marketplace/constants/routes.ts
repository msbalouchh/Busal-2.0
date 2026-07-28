export const MARKETPLACE_ROUTES = {
  overview: "/dashboard/marketplace",
  catalogue: "/dashboard/marketplace/catalogue",
  installed: "/dashboard/marketplace/installed",
  publishers: "/dashboard/marketplace/publishers",
  reviews: "/dashboard/marketplace/reviews",
  revenue: "/dashboard/marketplace/revenue",
  history: "/dashboard/marketplace/history",
} as const;

export const MARKETPLACE_NAV_ITEMS = [
  { label: "Overview", href: MARKETPLACE_ROUTES.overview },
  { label: "Catalogue", href: MARKETPLACE_ROUTES.catalogue },
  { label: "Installed", href: MARKETPLACE_ROUTES.installed },
  { label: "Publishers", href: MARKETPLACE_ROUTES.publishers },
  { label: "Reviews", href: MARKETPLACE_ROUTES.reviews },
  { label: "Revenue", href: MARKETPLACE_ROUTES.revenue },
  { label: "History", href: MARKETPLACE_ROUTES.history },
] as const;

export const MARKETPLACE_CATEGORIES = [
  "AI_AGENTS",
  "INTEGRATIONS",
  "INDUSTRY_PACKS",
  "THEMES",
  "WORKFLOW_PACKS",
  "DASHBOARD_PACKS",
  "REPORT_PACKS",
  "DOCUMENT_TEMPLATES",
  "PLUGINS",
] as const;

export const BUSAL_PLATFORM_VERSION = "2.0.0";

export const DEFAULT_MARKETPLACE_COMMISSION_RATE = 0.15;
