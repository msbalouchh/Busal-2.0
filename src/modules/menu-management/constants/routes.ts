import type { MenuStatus, MenuType } from "@prisma/client";

export const MENU_MANAGEMENT_ROUTES = {
  dashboard: "/app/restaurant/menus",
  list: "/app/restaurant/menus",
  create: "/app/restaurant/menus/new",
  details: (menuId: string) => `/app/restaurant/menus/${menuId}`,
  edit: (menuId: string) => `/app/restaurant/menus/${menuId}/edit`,
} as const;

export const MENU_LIST_PAGE_SIZE = 12;

export const MENU_STATUS_FILTER_OPTIONS: Array<{ value: MenuStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ARCHIVED", label: "Archived" },
];

export const MENU_TYPE_FILTER_OPTIONS: Array<{ value: MenuType | "ALL"; label: string }> = [
  { value: "ALL", label: "All types" },
  { value: "BREAKFAST", label: "Breakfast" },
  { value: "LUNCH", label: "Lunch" },
  { value: "DINNER", label: "Dinner" },
  { value: "ALL_DAY", label: "All day" },
  { value: "DRINKS", label: "Drinks" },
  { value: "DESSERT", label: "Dessert" },
  { value: "SPECIAL", label: "Special" },
  { value: "SEASONAL", label: "Seasonal" },
  { value: "CUSTOM", label: "Custom" },
];

export const MENU_TYPE_OPTIONS: Array<{ value: MenuType; label: string }> = [
  { value: "BREAKFAST", label: "Breakfast" },
  { value: "LUNCH", label: "Lunch" },
  { value: "DINNER", label: "Dinner" },
  { value: "ALL_DAY", label: "All day" },
  { value: "DRINKS", label: "Drinks" },
  { value: "DESSERT", label: "Dessert" },
  { value: "SPECIAL", label: "Special" },
  { value: "SEASONAL", label: "Seasonal" },
  { value: "CUSTOM", label: "Custom" },
];

export const MENU_SORT_OPTIONS = [
  { value: "displayOrder", label: "Display order" },
  { value: "name", label: "Name" },
  { value: "createdAt", label: "Created date" },
  { value: "status", label: "Status" },
  { value: "menuType", label: "Menu type" },
] as const;

export const MENU_DAY_OPTIONS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
] as const;
