export const QUOTES_ROUTES = {
  overview: "/dashboard/quotes",
  quotes: "/dashboard/quotes/quotes",
  templates: "/dashboard/quotes/templates",
  proposals: "/dashboard/quotes/proposals",
} as const;

export const PROPOSAL_PUBLIC_ROUTES = {
  view: (token: string) => `/proposals/${token}`,
} as const;

export const QUOTES_NAV_ITEMS = [
  { label: "Dashboard", href: QUOTES_ROUTES.overview },
  { label: "Quotes", href: QUOTES_ROUTES.quotes },
  { label: "Templates", href: QUOTES_ROUTES.templates },
  { label: "Proposals", href: QUOTES_ROUTES.proposals },
] as const;

export const QUOTE_STATUS_LABELS = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending approval",
  APPROVED: "Approved",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
} as const;

export const PROPOSAL_STATUS_LABELS = {
  DRAFT: "Draft",
  SENT: "Sent",
  VIEWED: "Viewed",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
} as const;

export const QUOTE_LINE_TYPE_LABELS = {
  PRODUCT: "Product",
  BUNDLE: "Bundle",
  IMPLEMENTATION_PACKAGE: "Implementation package",
  MANAGED_SERVICE: "Managed service",
  PROFESSIONAL_SERVICE: "Professional service",
  CUSTOM: "Custom",
} as const;

export const QUOTES_FUTURE_FEATURES = {
  contracts: "contracts",
} as const;
