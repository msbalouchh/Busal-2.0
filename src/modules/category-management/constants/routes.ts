export const CATEGORY_MANAGEMENT_ROUTES = {
  list: (menuId: string) => `/app/restaurant/menus/${menuId}/categories`,
  create: (menuId: string) => `/app/restaurant/menus/${menuId}/categories/new`,
  details: (menuId: string, categoryId: string) =>
    `/app/restaurant/menus/${menuId}/categories/${categoryId}`,
  edit: (menuId: string, categoryId: string) =>
    `/app/restaurant/menus/${menuId}/categories/${categoryId}/edit`,
} as const;

export const CATEGORY_LIST_PAGE_SIZE = 24;

export const CATEGORY_STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

export const CATEGORY_SORT_OPTIONS = [
  { value: "displayOrder", label: "Display order" },
  { value: "name", label: "Name" },
  { value: "createdAt", label: "Created date" },
  { value: "status", label: "Status" },
] as const;
