export const CUSTOMER_CRM_ROUTES = {
  dashboard: () => `/app/restaurant/customers`,
  list: () => `/app/restaurant/customers`,
  create: () => `/app/restaurant/customers/new`,
  profile: (customerId: string) => `/app/restaurant/customers/${customerId}`,
  loyalty: (customerId: string) => `/app/restaurant/customers/${customerId}/loyalty`,
  import: () => `/app/restaurant/customers/import`,
} as const;

export const CUSTOMER_LIST_PAGE_SIZE = 24;

export const CUSTOMER_STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

export const LOYALTY_TIER_OPTIONS = [
  { value: "BRONZE", label: "Bronze" },
  { value: "SILVER", label: "Silver" },
  { value: "GOLD", label: "Gold" },
  { value: "PLATINUM", label: "Platinum" },
  { value: "VIP", label: "VIP" },
] as const;

export const CUSTOMER_CRM_EXPORT_HEADERS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "tags",
  "notes",
  "marketingConsent",
] as const;
