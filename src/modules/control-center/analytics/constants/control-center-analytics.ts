import { CONTROL_CENTER_ROUTES } from "@/modules/control-center/constants/routes";

export const CONTROL_CENTER_ANALYTICS_ROUTES = {
  hub: CONTROL_CENTER_ROUTES.analytics,
} as const;

export const CONTROL_CENTER_ANALYTICS_PAGE_SIZE = 10;

export const ANALYTICS_RANGE_OPTIONS = [7, 30, 90] as const;

export const ANALYTICS_SECTIONS = [
  {
    id: "business",
    title: "Business Analytics",
    description: "Businesses, tenants, workspaces, and CRM activity.",
  },
  {
    id: "financial",
    title: "Financial Analytics",
    description: "Revenue, invoices, payments, and subscriptions.",
  },
  {
    id: "ai",
    title: "AI Analytics",
    description: "Token usage, tool executions, and agent activity.",
  },
  {
    id: "infrastructure",
    title: "Infrastructure Analytics",
    description: "API usage, storage, integrations, and performance.",
  },
  {
    id: "security",
    title: "Security Analytics",
    description: "Sessions, audit events, and security alerts.",
  },
  {
    id: "support",
    title: "Support Analytics",
    description: "Support conversations, incidents, and notifications.",
  },
  {
    id: "growth",
    title: "Growth Analytics",
    description: "Signups, expansion, and marketplace growth.",
  },
  {
    id: "commercial",
    title: "Commercial Analytics",
    description: "Plan distribution, MRR, and commercial performance.",
  },
  {
    id: "health",
    title: "Platform Health",
    description: "Tenant health, SLA performance, and system status.",
  },
] as const;

export type AnalyticsSectionId = (typeof ANALYTICS_SECTIONS)[number]["id"];
