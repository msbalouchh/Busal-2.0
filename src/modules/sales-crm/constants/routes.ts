export const SALES_CRM_ROUTES = {
  overview: "/dashboard/sales-crm",
  pipeline: "/dashboard/sales-crm/pipeline",
  leads: "/dashboard/sales-crm/leads",
  companies: "/dashboard/sales-crm/companies",
  contacts: "/dashboard/sales-crm/contacts",
  opportunities: "/dashboard/sales-crm/opportunities",
  activities: "/dashboard/sales-crm/activities",
  tasks: "/dashboard/sales-crm/tasks",
  demos: "/dashboard/sales-crm/demos",
} as const;

export const SALES_CRM_NAV_ITEMS = [
  { label: "Dashboard", href: SALES_CRM_ROUTES.overview },
  { label: "Pipeline", href: SALES_CRM_ROUTES.pipeline },
  { label: "Leads", href: SALES_CRM_ROUTES.leads },
  { label: "Companies", href: SALES_CRM_ROUTES.companies },
  { label: "Contacts", href: SALES_CRM_ROUTES.contacts },
  { label: "Opportunities", href: SALES_CRM_ROUTES.opportunities },
  { label: "Activities", href: SALES_CRM_ROUTES.activities },
  { label: "Tasks", href: SALES_CRM_ROUTES.tasks },
  { label: "Demos", href: SALES_CRM_ROUTES.demos },
] as const;

export const SALES_FUTURE_FEATURES = {
  quotes: "quotes",
  proposals: "proposals",
  contracts: "contracts",
  invoices: "invoices",
} as const;

export const LEAD_STATUS_LABELS = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  UNQUALIFIED: "Unqualified",
  CONVERTED: "Converted",
} as const;

export const LEAD_SOURCE_LABELS = {
  WEBSITE: "Website",
  REFERRAL: "Referral",
  COLD_OUTREACH: "Cold outreach",
  EVENT: "Event",
  OTHER: "Other",
} as const;

export const TASK_STATUS_LABELS = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;

export const DEMO_STATUS_LABELS = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No show",
} as const;

export const CATALOGUE_LINK_TYPE_LABELS = {
  PRODUCT: "Product",
  BUNDLE: "Bundle",
  IMPLEMENTATION_PACKAGE: "Implementation package",
  MANAGED_SERVICE: "Managed service",
} as const;
