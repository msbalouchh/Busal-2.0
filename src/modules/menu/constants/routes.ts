export const MENU_ROUTES = {
  overview: "/dashboard/menu",
  categories: "/dashboard/menu/categories",
  items: "/dashboard/menu/items",
  modifiers: "/dashboard/menu/modifiers",
} as const;

export const MENU_NAV_ITEMS = [
  { label: "Overview", href: MENU_ROUTES.overview },
  { label: "Categories", href: MENU_ROUTES.categories },
  { label: "Items", href: MENU_ROUTES.items },
  { label: "Modifiers", href: MENU_ROUTES.modifiers },
] as const;
