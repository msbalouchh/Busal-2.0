import { COMMERCIAL_ROUTES } from "@/modules/commercial/constants/routes";
import { CONTRACTS_ROUTES } from "@/modules/contracts/constants/routes";
import { CRM_ROUTES } from "@/modules/crm/constants/routes";
import { CUSTOMER_SUCCESS_ROUTES } from "@/modules/customer-success/constants/routes";
import { IMPLEMENTATION_ROUTES } from "@/modules/implementation/constants/routes";
import { QUOTES_ROUTES } from "@/modules/quotes/constants/routes";
import { REVOPS_ROUTES } from "@/modules/revops/constants/routes";
import { SALES_CRM_ROUTES } from "@/modules/sales-crm/constants/routes";

export const COMMERCIAL_PLATFORM_ROUTES = {
  overview: "/dashboard/commercial-platform",
  crm: "/dashboard/commercial-platform/crm",
  leads: "/dashboard/commercial-platform/leads",
  customers: "/dashboard/commercial-platform/customers",
  quotes: "/dashboard/commercial-platform/quotes",
  contracts: "/dashboard/commercial-platform/contracts",
  projects: "/dashboard/commercial-platform/projects",
  customerSuccess: "/dashboard/commercial-platform/customer-success",
  revenue: "/dashboard/commercial-platform/revenue",
  catalogue: COMMERCIAL_ROUTES.overview,
  salesCrm: SALES_CRM_ROUTES.overview,
  crmModule: CRM_ROUTES.overview,
  quotesModule: QUOTES_ROUTES.overview,
  contractsModule: CONTRACTS_ROUTES.overview,
  implementationModule: IMPLEMENTATION_ROUTES.overview,
  customerSuccessModule: CUSTOMER_SUCCESS_ROUTES.overview,
  revopsModule: REVOPS_ROUTES.overview,
} as const;

export const COMMERCIAL_PLATFORM_NAV_ITEMS = [
  { label: "Overview", href: COMMERCIAL_PLATFORM_ROUTES.overview },
  { label: "CRM", href: COMMERCIAL_PLATFORM_ROUTES.crm },
  { label: "Leads", href: COMMERCIAL_PLATFORM_ROUTES.leads },
  { label: "Customers", href: COMMERCIAL_PLATFORM_ROUTES.customers },
  { label: "Quotes", href: COMMERCIAL_PLATFORM_ROUTES.quotes },
  { label: "Contracts", href: COMMERCIAL_PLATFORM_ROUTES.contracts },
  { label: "Projects", href: COMMERCIAL_PLATFORM_ROUTES.projects },
  { label: "Customer Success", href: COMMERCIAL_PLATFORM_ROUTES.customerSuccess },
  { label: "Revenue", href: COMMERCIAL_PLATFORM_ROUTES.revenue },
] as const;

export const LEAD_PIPELINE_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "UNQUALIFIED",
  "CONVERTED",
] as const;

export const COMMERCIAL_LEADS_PAGE_SIZE = 20;
