export const PRODUCT_MANAGEMENT_ROUTES = {
  list: (menuId: string) => `/app/restaurant/menus/${menuId}/products`,
  create: (menuId: string) => `/app/restaurant/menus/${menuId}/products/new`,
  details: (menuId: string, productId: string) =>
    `/app/restaurant/menus/${menuId}/products/${productId}`,
  edit: (menuId: string, productId: string) =>
    `/app/restaurant/menus/${menuId}/products/${productId}/edit`,
} as const;

export const PRODUCT_LIST_PAGE_SIZE = 24;

export const PRODUCT_STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

export const PRODUCT_TYPE_FILTER_OPTIONS = [
  { value: "ALL", label: "All types" },
  { value: "FOOD", label: "Food" },
  { value: "DRINK", label: "Drink" },
  { value: "DESSERT", label: "Dessert" },
  { value: "COMBO", label: "Combo" },
  { value: "ADDON", label: "Add-on" },
  { value: "CUSTOM", label: "Custom" },
] as const;

export const PRODUCT_TYPE_OPTIONS = [
  { value: "FOOD", label: "Food" },
  { value: "DRINK", label: "Drink" },
  { value: "DESSERT", label: "Dessert" },
  { value: "COMBO", label: "Combo" },
  { value: "ADDON", label: "Add-on" },
  { value: "CUSTOM", label: "Custom" },
] as const;

export const PRODUCT_SORT_OPTIONS = [
  { value: "displayOrder", label: "Display order" },
  { value: "name", label: "Name" },
  { value: "price", label: "Price" },
  { value: "createdAt", label: "Created date" },
  { value: "status", label: "Status" },
] as const;

export const PRODUCT_DIETARY_FILTER_OPTIONS = [
  { value: "ALL", label: "All dietary" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "halal", label: "Halal" },
  { value: "glutenFree", label: "Gluten free" },
  { value: "featured", label: "Featured" },
] as const;
