export const KITCHEN_ROUTES = {
  overview: "/dashboard/kitchen",
} as const;

export const KITCHEN_BOARD_STATUSES = ["NEW", "ACKNOWLEDGED", "PREPARING", "READY"] as const;

export const KITCHEN_REFRESH_INTERVAL_MS = 10_000;

export const KITCHEN_URGENT_MINUTES = 15;

export const KITCHEN_STATION_OPTIONS = [
  { value: "", label: "All stations" },
  { value: "GENERAL", label: "General" },
] as const;

export const KITCHEN_PRIORITY_OPTIONS = [
  { value: "", label: "All priorities" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
] as const;

export const KITCHEN_STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "NEW", label: "New" },
  { value: "ACKNOWLEDGED", label: "Acknowledged" },
  { value: "PREPARING", label: "Preparing" },
  { value: "READY", label: "Ready" },
] as const;

export type KitchenBoardStatus = (typeof KITCHEN_BOARD_STATUSES)[number];

export type KitchenStationFilterValue = (typeof KITCHEN_STATION_OPTIONS)[number]["value"];

export type KitchenPriorityFilterValue = (typeof KITCHEN_PRIORITY_OPTIONS)[number]["value"];

export type KitchenStatusFilterValue = (typeof KITCHEN_STATUS_FILTER_OPTIONS)[number]["value"];
