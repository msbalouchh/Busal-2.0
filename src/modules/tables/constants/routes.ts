export const TABLE_ROUTES = {
  overview: "/dashboard/tables",
} as const;

export const TABLE_STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Available" },
  { value: "RESERVED", label: "Reserved" },
  { value: "OCCUPIED", label: "Occupied" },
  { value: "CLEANING", label: "Cleaning" },
  { value: "OUT_OF_SERVICE", label: "Out of Service" },
] as const;

export const TABLE_SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "section", label: "Section" },
  { value: "capacity", label: "Capacity" },
] as const;

export type TableStatusValue = (typeof TABLE_STATUS_OPTIONS)[number]["value"];
export type TableSortValue = (typeof TABLE_SORT_OPTIONS)[number]["value"];
