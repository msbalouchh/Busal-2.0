export const CONTROL_CENTER_MARKETPLACE_ROUTES = {
  overview: "/control-center/marketplace",
  item: (itemId: string) => `/control-center/marketplace?item=${itemId}`,
  publisher: (publisherId: string) => `/control-center/marketplace?publisher=${publisherId}`,
} as const;

export const CONTROL_CENTER_MARKETPLACE_PAGE_SIZE = 20;

export const MARKETPLACE_ITEM_STATUS_OPTIONS = [
  "DRAFT",
  "PUBLISHED",
  "DEPRECATED",
  "ARCHIVED",
] as const;

export const MARKETPLACE_LICENSE_STATUS_OPTIONS = [
  "ACTIVE",
  "EXPIRED",
  "TRIAL",
  "CANCELLED",
] as const;

export const MARKETPLACE_ISSUE_STATUS_OPTIONS = ["OPEN", "RESOLVED", "DISMISSED"] as const;

export const MARKETPLACE_CATALOG_FILTER_CATEGORIES = [
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
