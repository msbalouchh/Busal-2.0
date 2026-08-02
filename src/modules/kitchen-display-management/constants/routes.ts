export const KITCHEN_DISPLAY_ROUTES = {
  dashboard: () => `/app/restaurant/kitchen`,
  dashboardForBranch: (branchId: string, stationId?: string) => {
    const params = new URLSearchParams({ branchId });
    if (stationId) params.set("stationId", stationId);
    return `/app/restaurant/kitchen?${params.toString()}`;
  },
  fullscreen: (branchId: string, stationId?: string) => {
    const params = new URLSearchParams({ branchId });
    if (stationId) params.set("stationId", stationId);
    return `/app/restaurant/kitchen/fullscreen?${params.toString()}`;
  },
  stations: (branchId: string) => `/app/restaurant/kitchen/stations?branchId=${branchId}`,
} as const;

export const KITCHEN_REFRESH_INTERVAL_MS = 8_000;

export const KITCHEN_QUEUE_COLUMNS = [
  { value: "NEW", label: "New", orderStatus: "PENDING" as const },
  { value: "ACCEPTED", label: "Accepted", orderStatus: "CONFIRMED" as const },
  { value: "PREPARING", label: "Preparing", orderStatus: "PREPARING" as const },
  { value: "READY", label: "Ready", orderStatus: "READY" as const },
] as const;

export const KITCHEN_COMPLETED_STATUSES = ["SERVED", "COMPLETED"] as const;

export const KITCHEN_STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All active" },
  { value: "NEW", label: "New" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "PREPARING", label: "Preparing" },
  { value: "READY", label: "Ready" },
  { value: "SERVED", label: "Served" },
  { value: "COMPLETED", label: "Completed" },
] as const;

export const KITCHEN_STATION_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ARCHIVED", label: "Archived" },
] as const;
