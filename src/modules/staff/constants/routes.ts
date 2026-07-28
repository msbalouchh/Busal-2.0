export const STAFF_ROUTES = {
  overview: "/dashboard/staff",
  members: "/dashboard/staff/members",
  roles: "/dashboard/staff/roles",
  permissions: "/dashboard/staff/permissions",
} as const;

export const STAFF_NAV_ITEMS = [
  { label: "Overview", href: STAFF_ROUTES.overview },
  { label: "Members", href: STAFF_ROUTES.members },
  { label: "Roles", href: STAFF_ROUTES.roles },
  { label: "Permissions", href: STAFF_ROUTES.permissions },
] as const;
