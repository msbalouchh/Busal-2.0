export const STAFF_MANAGEMENT_ROUTES = {
  overview: "/dashboard/staff",
  directory: "/dashboard/staff/directory",
  members: "/dashboard/staff/members",
  invitations: "/dashboard/staff/invitations",
  roles: "/dashboard/staff/roles",
  permissions: "/dashboard/staff/permissions",
  activity: "/dashboard/staff/activity",
} as const;

export const STAFF_MANAGEMENT_NAV_ITEMS = [
  { label: "Overview", href: STAFF_MANAGEMENT_ROUTES.overview },
  { label: "Directory", href: STAFF_MANAGEMENT_ROUTES.directory },
  { label: "Invitations", href: STAFF_MANAGEMENT_ROUTES.invitations },
  { label: "Roles", href: STAFF_MANAGEMENT_ROUTES.roles },
  { label: "Permissions", href: STAFF_MANAGEMENT_ROUTES.permissions },
  { label: "Activity", href: STAFF_MANAGEMENT_ROUTES.activity },
] as const;

export const DEPARTMENT_OPTIONS = [
  "Operations",
  "Front of House",
  "Kitchen",
  "Management",
  "Sales",
  "Marketing",
  "Finance",
  "HR",
  "IT",
  "Customer Success",
] as const;

export const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "ON_LEAVE", label: "On leave" },
  { value: "PROBATION", label: "Probation" },
  { value: "TERMINATED", label: "Terminated" },
] as const;

export const ACCOUNT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "LOCKED", label: "Locked" },
  { value: "SUSPENDED", label: "Suspended" },
] as const;

export const STAFF_DIRECTORY_PAGE_SIZE = 10;

export const STAFF_INVITATION_EXPIRY_DAYS = 7;

export const PERMISSION_ACTIONS = [
  "view",
  "create",
  "edit",
  "delete",
  "approve",
  "export",
  "manage",
] as const;
