/** Architecture route markers (distinct from legacy STAFF_ROUTES). */
export const STAFF_PLATFORM_ROUTES = {
  overview: "/dashboard/staff",
  directory: "/dashboard/staff/directory",
  schedule: "/dashboard/staff",
  attendance: "/dashboard/staff/activity",
  leave: "/dashboard/staff",
  analytics: "/dashboard/reporting/staff",
} as const;

export const STAFF_PLATFORM_NAV_ITEMS = [
  { label: "Overview", href: STAFF_PLATFORM_ROUTES.overview },
  { label: "Directory", href: STAFF_PLATFORM_ROUTES.directory },
  { label: "Schedule", href: STAFF_PLATFORM_ROUTES.schedule },
  { label: "Attendance", href: STAFF_PLATFORM_ROUTES.attendance },
  { label: "Leave", href: STAFF_PLATFORM_ROUTES.leave },
  { label: "Analytics", href: STAFF_PLATFORM_ROUTES.analytics },
] as const;
