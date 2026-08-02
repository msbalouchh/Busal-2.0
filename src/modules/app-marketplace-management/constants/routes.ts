import { APP_TYPE_CATEGORIES } from "@/modules/app-marketplace-management/constants/categories";

export const APP_MARKETPLACE_ROUTES = {
  home: () => `/app/marketplace`,
  store: () => `/app/marketplace/store`,
  appDetail: (appId: string) => `/app/marketplace/apps/${appId}`,
  installed: () => `/app/marketplace/installed`,
  updates: () => `/app/marketplace/updates`,
  settings: (installedAppId: string) => `/app/marketplace/settings/${installedAppId}`,
  reviews: () => `/app/marketplace/reviews`,
  categories: () => `/app/marketplace/categories`,
  search: () => `/app/marketplace/search`,
} as const;

export const APP_MARKETPLACE_NAV_ITEMS = [
  { id: "home", label: "Home", href: APP_MARKETPLACE_ROUTES.home() },
  { id: "store", label: "App Store", href: APP_MARKETPLACE_ROUTES.store() },
  { id: "installed", label: "Installed", href: APP_MARKETPLACE_ROUTES.installed() },
  { id: "updates", label: "Updates", href: APP_MARKETPLACE_ROUTES.updates() },
  { id: "reviews", label: "Reviews", href: APP_MARKETPLACE_ROUTES.reviews() },
  { id: "categories", label: "Categories", href: APP_MARKETPLACE_ROUTES.categories() },
  { id: "search", label: "Search", href: APP_MARKETPLACE_ROUTES.search() },
] as const;

export const CATEGORY_OPTIONS = APP_TYPE_CATEGORIES.map((category) => ({
  value: category,
  label: category.charAt(0).toUpperCase() + category.slice(1),
}));

export const PRICING_MODEL_OPTIONS = [
  { value: "FREE", label: "Free" },
  { value: "PAID", label: "Paid" },
  { value: "SUBSCRIPTION", label: "Subscription" },
  { value: "ENTERPRISE", label: "Enterprise" },
] as const;
