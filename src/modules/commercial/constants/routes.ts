export const COMMERCIAL_ROUTES = {
  overview: "/dashboard/commercial",
  categories: "/dashboard/commercial/categories",
  products: "/dashboard/commercial/products",
  bundles: "/dashboard/commercial/bundles",
  priceBooks: "/dashboard/commercial/price-books",
} as const;

export const COMMERCIAL_NAV_ITEMS = [
  { label: "Overview", href: COMMERCIAL_ROUTES.overview },
  { label: "Categories", href: COMMERCIAL_ROUTES.categories },
  { label: "Products", href: COMMERCIAL_ROUTES.products },
  { label: "Bundles", href: COMMERCIAL_ROUTES.bundles },
  { label: "Price Books", href: COMMERCIAL_ROUTES.priceBooks },
] as const;

export const COMMERCIAL_FUTURE_FEATURES = {
  quoting: "quoting",
  contracts: "contracts",
  subscriptions: "subscriptions",
  partnerPortal: "partnerPortal",
} as const;

export const PRICING_MODEL_LABELS = {
  ONE_TIME: "One-time",
  MONTHLY: "Monthly",
  ANNUAL: "Annual",
  USAGE_BASED: "Usage-based",
  CUSTOM: "Custom",
} as const;

export const PRICE_BOOK_TYPE_LABELS = {
  STANDARD: "Standard",
  PROMOTIONAL: "Promotional",
  ENTERPRISE: "Enterprise",
  COUNTRY_SPECIFIC: "Country-specific",
  PARTNER_SPECIFIC: "Partner-specific",
} as const;
