/** Architecture route markers for the Billing platform. */
export const BILLING_PLATFORM_ROUTES = {
  overview: "/dashboard/settings",
  plans: "/pricing",
  subscription: "/dashboard/settings",
  invoices: "/dashboard/payments",
  usage: "/dashboard/reporting/financial",
  enterprise: "/contact",
} as const;

export const BILLING_PLATFORM_NAV_ITEMS = [
  { label: "Overview", href: BILLING_PLATFORM_ROUTES.overview },
  { label: "Plans", href: BILLING_PLATFORM_ROUTES.plans },
  { label: "Subscription", href: BILLING_PLATFORM_ROUTES.subscription },
  { label: "Invoices", href: BILLING_PLATFORM_ROUTES.invoices },
  { label: "Usage", href: BILLING_PLATFORM_ROUTES.usage },
  { label: "Enterprise", href: BILLING_PLATFORM_ROUTES.enterprise },
] as const;
