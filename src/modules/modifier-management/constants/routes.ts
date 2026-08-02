export const MODIFIER_MANAGEMENT_ROUTES = {
  list: (menuId: string) => `/app/restaurant/menus/${menuId}/modifiers`,
  create: (menuId: string) => `/app/restaurant/menus/${menuId}/modifiers/new`,
  details: (menuId: string, modifierGroupId: string) =>
    `/app/restaurant/menus/${menuId}/modifiers/${modifierGroupId}`,
  edit: (menuId: string, modifierGroupId: string) =>
    `/app/restaurant/menus/${menuId}/modifiers/${modifierGroupId}/edit`,
  assign: (menuId: string, productId?: string) =>
    productId
      ? `/app/restaurant/menus/${menuId}/modifiers/assign?productId=${productId}`
      : `/app/restaurant/menus/${menuId}/modifiers/assign`,
} as const;

export const MODIFIER_LIST_PAGE_SIZE = 24;

export const MODIFIER_STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

export const MODIFIER_SELECTION_TYPE_OPTIONS = [
  { value: "SINGLE", label: "Single selection" },
  { value: "MULTIPLE", label: "Multiple selection" },
] as const;

export const MODIFIER_SELECTION_TYPE_FILTER_OPTIONS = [
  { value: "ALL", label: "All selection types" },
  ...MODIFIER_SELECTION_TYPE_OPTIONS,
] as const;

export const MODIFIER_SORT_OPTIONS = [
  { value: "displayOrder", label: "Display order" },
  { value: "name", label: "Name" },
  { value: "createdAt", label: "Created date" },
  { value: "status", label: "Status" },
] as const;

export const MODIFIER_OPTION_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ARCHIVED", label: "Archived" },
] as const;
