export const QR_MENU_ROUTES = {
  overview: "/dashboard/qr-menu",
} as const;

export const QR_ASSIGNMENT_FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "assigned", label: "Assigned" },
  { value: "unassigned", label: "Unassigned" },
] as const;

export type QRAssignmentFilterValue = "" | "assigned" | "unassigned";
