/** Architecture route markers (distinct from legacy RESERVATION_ROUTES). */
export const RESERVATION_PLATFORM_ROUTES = {
  overview: "/app/restaurant/reservations",
  calendar: "/app/restaurant/reservations/calendar",
  waitlist: "/app/restaurant/reservations/waitlist",
  analytics: "/app/restaurant/reservations/analytics",
} as const;

export const RESERVATION_PLATFORM_NAV_ITEMS = [
  { label: "Overview", href: RESERVATION_PLATFORM_ROUTES.overview },
  { label: "Calendar", href: RESERVATION_PLATFORM_ROUTES.calendar },
  { label: "Waitlist", href: RESERVATION_PLATFORM_ROUTES.waitlist },
  { label: "Analytics", href: RESERVATION_PLATFORM_ROUTES.analytics },
] as const;
