export const CRM_ROUTES = {
  overview: "/dashboard/crm",
  customers: "/dashboard/crm/customers",
  customer: (customerId: string) => `/dashboard/crm/customers/${customerId}`,
  loyalty: "/dashboard/crm/loyalty",
  rewards: "/dashboard/crm/rewards",
  groups: "/dashboard/crm/groups",
} as const;

export const CRM_NAV_ITEMS = [
  { label: "Overview", href: CRM_ROUTES.overview },
  { label: "Customers", href: CRM_ROUTES.customers },
  { label: "Loyalty", href: CRM_ROUTES.loyalty },
  { label: "Rewards", href: CRM_ROUTES.rewards },
  { label: "Groups", href: CRM_ROUTES.groups },
] as const;

export const DEFAULT_CUSTOMER_GROUPS = [
  { name: "Regular", slug: "regular" },
  { name: "VIP", slug: "vip" },
  { name: "Corporate", slug: "corporate" },
  { name: "Staff", slug: "staff" },
] as const;

export const CRM_FUTURE_FEATURES = {
  emailMarketing: "emailMarketing",
  smsMarketing: "smsMarketing",
  pushNotifications: "pushNotifications",
  segmentation: "segmentation",
  aiRecommendations: "aiRecommendations",
  referralProgram: "referralProgram",
  giftCards: "giftCards",
} as const;
