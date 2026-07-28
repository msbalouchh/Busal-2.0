export const INVENTORY_ROUTES = {
  overview: "/dashboard/inventory",
  ingredients: "/dashboard/inventory/ingredients",
  recipes: "/dashboard/inventory/recipes",
  suppliers: "/dashboard/inventory/suppliers",
  movements: "/dashboard/inventory/movements",
} as const;

export const INVENTORY_NAV_ITEMS = [
  { label: "Overview", href: INVENTORY_ROUTES.overview },
  { label: "Ingredients", href: INVENTORY_ROUTES.ingredients },
  { label: "Recipes", href: INVENTORY_ROUTES.recipes },
  { label: "Suppliers", href: INVENTORY_ROUTES.suppliers },
  { label: "Movements", href: INVENTORY_ROUTES.movements },
] as const;
