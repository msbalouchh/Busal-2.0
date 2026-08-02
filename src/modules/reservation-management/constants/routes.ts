export const RESERVATION_MANAGEMENT_ROUTES = {
  list: () => `/app/restaurant/reservations`,
  listForBranch: (branchId: string) => `/app/restaurant/reservations?branchId=${branchId}`,
  listWithView: (branchId: string, view: ReservationViewMode, date?: string) => {
    const params = new URLSearchParams({ branchId, view });
    if (date) params.set("date", date);
    return `/app/restaurant/reservations?${params.toString()}`;
  },
  create: (branchId: string) => `/app/restaurant/reservations/new?branchId=${branchId}`,
  details: (reservationId: string, branchId: string) =>
    `/app/restaurant/reservations/${reservationId}?branchId=${branchId}`,
  edit: (reservationId: string, branchId: string) =>
    `/app/restaurant/reservations/${reservationId}/edit?branchId=${branchId}`,
} as const;

export type ReservationViewMode = "list" | "calendar" | "timeline";

export const RESERVATION_LIST_PAGE_SIZE = 24;

export const RESERVATION_STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "SEATED", label: "Seated" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No show" },
] as const;

export const RESERVATION_SOURCE_FILTER_OPTIONS = [
  { value: "ALL", label: "All sources" },
  { value: "PHONE", label: "Phone" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "WEBSITE", label: "Website" },
  { value: "QR", label: "QR" },
  { value: "GOOGLE", label: "Google" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "OTHER", label: "Other" },
] as const;

export const RESERVATION_SOURCE_OPTIONS = [
  { value: "PHONE", label: "Phone" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "WEBSITE", label: "Website" },
  { value: "QR", label: "QR" },
  { value: "GOOGLE", label: "Google" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "OTHER", label: "Other" },
] as const;

export const RESERVATION_SORT_OPTIONS = [
  { value: "reservationDate", label: "Date" },
  { value: "startTime", label: "Start time" },
  { value: "guestName", label: "Guest name" },
  { value: "partySize", label: "Party size" },
  { value: "status", label: "Status" },
  { value: "createdAt", label: "Created date" },
] as const;

export const RESERVATION_VIEW_OPTIONS = [
  { value: "list", label: "List" },
  { value: "calendar", label: "Calendar" },
  { value: "timeline", label: "Timeline" },
] as const;

export const ACTIVE_RESERVATION_STATUSES = ["PENDING", "CONFIRMED", "SEATED"] as const;
