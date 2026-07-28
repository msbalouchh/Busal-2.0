export const IMPORT_EXPORT_PLATFORM_ROUTES = {
  overview: "/dashboard/import-export-platform",
  imports: "/dashboard/import-export-platform/imports",
  exports: "/dashboard/import-export-platform/exports",
  templates: "/dashboard/import-export-platform/templates",
  schedules: "/dashboard/import-export-platform/schedules",
  history: "/dashboard/import-export-platform/history",
  registry: "/dashboard/import-export-platform/registry",
  audit: "/dashboard/import-export-platform/audit",
} as const;

export const IMPORT_EXPORT_PLATFORM_NAV_ITEMS = [
  { label: "Overview", href: IMPORT_EXPORT_PLATFORM_ROUTES.overview },
  { label: "Imports", href: IMPORT_EXPORT_PLATFORM_ROUTES.imports },
  { label: "Exports", href: IMPORT_EXPORT_PLATFORM_ROUTES.exports },
  { label: "Templates", href: IMPORT_EXPORT_PLATFORM_ROUTES.templates },
  { label: "Schedules", href: IMPORT_EXPORT_PLATFORM_ROUTES.schedules },
  { label: "History", href: IMPORT_EXPORT_PLATFORM_ROUTES.history },
  { label: "Registry", href: IMPORT_EXPORT_PLATFORM_ROUTES.registry },
  { label: "Audit", href: IMPORT_EXPORT_PLATFORM_ROUTES.audit },
] as const;

export const IMPORT_FORMATS = ["CSV", "EXCEL", "JSON"] as const;

export const EXPORT_FORMATS = ["CSV", "EXCEL", "PDF", "JSON"] as const;

export const SUPPORTED_MODULES = [
  "customers",
  "staff",
  "menu",
  "inventory",
  "orders",
  "reservations",
  "crm",
  "contracts",
  "projects",
  "files",
  "reports",
  "marketplace",
  "ai-knowledge",
] as const;

export const DEFAULT_BATCH_SIZE = 100;

export const PREVIEW_ROW_LIMIT = 10;
