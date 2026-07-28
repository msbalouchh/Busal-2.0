export const BRANCH_ROUTES = {
  overview: "/dashboard/branches",
  branch: (branchId: string) => `/dashboard/branches/${branchId}`,
  manage: "/dashboard/business/branches",
} as const;

export const BRANCH_NAV_ITEMS = [
  { label: "Central Dashboard", href: BRANCH_ROUTES.overview },
  { label: "Manage Branches", href: BRANCH_ROUTES.manage },
] as const;

export const BRANCH_FUTURE_FEATURES = {
  multiRegion: "multiRegion",
  branchHierarchy: "branchHierarchy",
  franchiseMode: "franchiseMode",
} as const;
