import { MARKETPLACE_ROUTES } from "@/modules/marketplace/constants/routes";

export const MARKETPLACE_PLATFORM_ROUTES = {
  overview: "/dashboard/marketplace-platform",
  catalog: "/dashboard/marketplace-platform/catalog",
  installations: "/dashboard/marketplace-platform/installations",
  agents: "/dashboard/marketplace-platform/agents",
  licenses: "/dashboard/marketplace-platform/licenses",
  publisher: "/dashboard/marketplace-platform/publisher",
  analytics: "/dashboard/marketplace-platform/analytics",
  marketplaceModule: MARKETPLACE_ROUTES.overview,
  catalogueModule: MARKETPLACE_ROUTES.catalogue,
  installedModule: MARKETPLACE_ROUTES.installed,
} as const;

export function marketplaceProductRoute(slug: string): string {
  return `/dashboard/marketplace-platform/catalog/${slug}`;
}

export const MARKETPLACE_PLATFORM_NAV_ITEMS = [
  { label: "Home", href: MARKETPLACE_PLATFORM_ROUTES.overview },
  { label: "Catalog", href: MARKETPLACE_PLATFORM_ROUTES.catalog },
  { label: "Installations", href: MARKETPLACE_PLATFORM_ROUTES.installations },
  { label: "AI Agent Store", href: MARKETPLACE_PLATFORM_ROUTES.agents },
  { label: "Licenses", href: MARKETPLACE_PLATFORM_ROUTES.licenses },
  { label: "Publisher", href: MARKETPLACE_PLATFORM_ROUTES.publisher },
  { label: "Analytics", href: MARKETPLACE_PLATFORM_ROUTES.analytics },
] as const;

export const MARKETPLACE_HOME_SECTIONS = [
  {
    key: "featured_apps",
    label: "Featured Apps",
    categories: ["INTEGRATIONS", "PLUGINS"] as const,
  },
  { key: "featured_agents", label: "Featured AI Agents", categories: ["AI_AGENTS"] as const },
  { key: "themes", label: "Themes", categories: ["THEMES"] as const },
  { key: "plugins", label: "Plugins", categories: ["PLUGINS"] as const },
  { key: "industry_packs", label: "Industry Packs", categories: ["INDUSTRY_PACKS"] as const },
  { key: "workflow_packs", label: "Workflow Packs", categories: ["WORKFLOW_PACKS"] as const },
  { key: "dashboard_packs", label: "Dashboard Packs", categories: ["DASHBOARD_PACKS"] as const },
  { key: "report_packs", label: "Report Packs", categories: ["REPORT_PACKS"] as const },
] as const;

export const MARKETPLACE_CATALOG_SORT_OPTIONS = [
  "featured",
  "rating",
  "downloads",
  "name",
  "price_asc",
  "price_desc",
] as const;

export const MARKETPLACE_CATALOG_PAGE_SIZE = 24;
