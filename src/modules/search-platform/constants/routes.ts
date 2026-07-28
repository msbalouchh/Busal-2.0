export const SEARCH_PLATFORM_ROUTES = {
  overview: "/dashboard/search",
  index: "/dashboard/search/index",
  queries: "/dashboard/search/queries",
  suggestions: "/dashboard/search/suggestions",
  indexJobs: "/dashboard/search/index-jobs",
  audit: "/dashboard/search/audit",
  registry: "/dashboard/search/registry",
} as const;

export const SEARCH_PLATFORM_NAV_ITEMS = [
  { label: "Overview", href: SEARCH_PLATFORM_ROUTES.overview },
  { label: "Index", href: SEARCH_PLATFORM_ROUTES.index },
  { label: "Queries", href: SEARCH_PLATFORM_ROUTES.queries },
  { label: "Suggestions", href: SEARCH_PLATFORM_ROUTES.suggestions },
  { label: "Index Jobs", href: SEARCH_PLATFORM_ROUTES.indexJobs },
  { label: "Registry", href: SEARCH_PLATFORM_ROUTES.registry },
  { label: "Audit", href: SEARCH_PLATFORM_ROUTES.audit },
] as const;

export const SEARCH_ENTITY_TYPES = [
  "CUSTOMER",
  "STAFF",
  "BUSINESS",
  "BRANCH",
  "ORDER",
  "RESERVATION",
  "TABLE",
  "MENU_ITEM",
  "INVENTORY",
  "SUPPLIER",
  "CRM",
  "LEAD",
  "OPPORTUNITY",
  "QUOTE",
  "CONTRACT",
  "PROJECT",
  "FILE",
  "CONVERSATION",
  "AI_KNOWLEDGE",
  "MARKETPLACE_ASSET",
  "REPORT",
  "WORKFLOW",
] as const;

export const SEARCH_MATCH_MODES = ["FULL_TEXT", "PREFIX", "FUZZY", "EXACT"] as const;

export const SEARCH_INDEX_JOB_TYPES = ["INCREMENTAL", "FULL_REBUILD", "REINDEX_ENTITY"] as const;

export const DEFAULT_SEARCH_PAGE_SIZE = 20;
