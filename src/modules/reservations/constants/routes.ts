export const RESERVATION_ROUTES = {
  overview: "/dashboard/reservations",
} as const;

export const RESERVATION_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "SEATED", label: "Seated" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No Show" },
] as const;

export const RESERVATION_SOURCE_OPTIONS = [
  { value: "WALK_IN", label: "Walk-in" },
  { value: "PHONE", label: "Phone" },
  { value: "WEBSITE", label: "Website" },
  { value: "QR", label: "QR" },
  { value: "ADMIN", label: "Admin" },
] as const;

export type ReservationStatusValue = (typeof RESERVATION_STATUS_OPTIONS)[number]["value"];
export type ReservationSourceValue = (typeof RESERVATION_SOURCE_OPTIONS)[number]["value"];

export const RESERVATION_SORT_OPTIONS = [
  { value: "date", label: "Reservation Date" },
  { value: "time", label: "Start Time" },
] as const;

export type ReservationSortValue = (typeof RESERVATION_SORT_OPTIONS)[number]["value"];
