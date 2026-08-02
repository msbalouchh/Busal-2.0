export const FLOOR_TABLE_MANAGEMENT_ROUTES = {
  floorList: () => `/app/restaurant/floors`,
  floorListForBranch: (branchId: string) => `/app/restaurant/floors?branchId=${branchId}`,
  floorCreate: (branchId: string) => `/app/restaurant/floors/new?branchId=${branchId}`,
  floorDetails: (floorId: string, branchId: string) =>
    `/app/restaurant/floors/${floorId}?branchId=${branchId}`,
  floorEdit: (floorId: string, branchId: string) =>
    `/app/restaurant/floors/${floorId}/edit?branchId=${branchId}`,
  tableCreate: (floorId: string, branchId: string) =>
    `/app/restaurant/floors/${floorId}/tables/new?branchId=${branchId}`,
  tableDetails: (floorId: string, tableId: string, branchId: string) =>
    `/app/restaurant/floors/${floorId}/tables/${tableId}?branchId=${branchId}`,
  tableEdit: (floorId: string, tableId: string, branchId: string) =>
    `/app/restaurant/floors/${floorId}/tables/${tableId}/edit?branchId=${branchId}`,
} as const;

export const FLOOR_LIST_PAGE_SIZE = 24;
export const TABLE_LIST_PAGE_SIZE = 48;

export const FLOOR_STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

export const TABLE_STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "AVAILABLE", label: "Available" },
  { value: "OCCUPIED", label: "Occupied" },
  { value: "RESERVED", label: "Reserved" },
  { value: "DIRTY", label: "Dirty" },
  { value: "OUT_OF_SERVICE", label: "Out of service" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

export const TABLE_SHAPE_OPTIONS = [
  { value: "SQUARE", label: "Square" },
  { value: "RECTANGLE", label: "Rectangle" },
  { value: "ROUND", label: "Round" },
  { value: "OVAL", label: "Oval" },
  { value: "CUSTOM", label: "Custom" },
] as const;

export const FLOOR_SORT_OPTIONS = [
  { value: "displayOrder", label: "Display order" },
  { value: "name", label: "Name" },
  { value: "createdAt", label: "Created date" },
  { value: "status", label: "Status" },
] as const;

export const TABLE_SORT_OPTIONS = [
  { value: "tableNumber", label: "Table number" },
  { value: "capacity", label: "Capacity" },
  { value: "createdAt", label: "Created date" },
  { value: "status", label: "Status" },
] as const;
