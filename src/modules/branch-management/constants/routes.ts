export const BRANCH_MANAGEMENT_ROUTES = {
  list: "/app/branches",
  create: "/app/branches/new",
  details: (branchId: string) => `/app/branches/${branchId}`,
  edit: (branchId: string) => `/app/branches/${branchId}/edit`,
  settings: (branchId: string) => `/app/branches/${branchId}/settings`,
} as const;

export const BRANCH_LIST_PAGE_SIZE = 12;
