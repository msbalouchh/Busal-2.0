import type { RecommendationStatus, SalesPriority } from "@prisma/client";

export const AI_SALES_AGENT_ROUTES = {
  dashboard: () => `/app/ai/sales`,
  insights: () => `/app/ai/sales/insights`,
  recommendations: () => `/app/ai/sales/recommendations`,
  opportunities: () => `/app/ai/sales/opportunities`,
  revenue: () => `/app/ai/sales/revenue`,
  search: () => `/app/ai/sales/search`,
} as const;

export const SALES_PRIORITY_OPTIONS: Array<{ value: SalesPriority | "ALL"; label: string }> = [
  { value: "ALL", label: "All priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

export const RECOMMENDATION_STATUS_OPTIONS: Array<{
  value: RecommendationStatus | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "All statuses" },
  { value: "NEW", label: "New" },
  { value: "VIEWED", label: "Viewed" },
  { value: "IMPLEMENTED", label: "Implemented" },
  { value: "DISMISSED", label: "Dismissed" },
];

export const INSIGHT_CATEGORY_OPTIONS = [
  { value: "ALL", label: "All categories" },
  { value: "revenue", label: "Revenue" },
  { value: "pipeline", label: "Pipeline" },
  { value: "quotes", label: "Quotes" },
  { value: "customers", label: "Customers" },
  { value: "products", label: "Products" },
  { value: "follow_up", label: "Follow-up" },
] as const;

export const SALES_AGENT_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: AI_SALES_AGENT_ROUTES.dashboard() },
  { id: "insights", label: "Insights", href: AI_SALES_AGENT_ROUTES.insights() },
  {
    id: "recommendations",
    label: "Recommendations",
    href: AI_SALES_AGENT_ROUTES.recommendations(),
  },
  { id: "opportunities", label: "Opportunities", href: AI_SALES_AGENT_ROUTES.opportunities() },
  { id: "revenue", label: "Revenue", href: AI_SALES_AGENT_ROUTES.revenue() },
  { id: "search", label: "Search", href: AI_SALES_AGENT_ROUTES.search() },
] as const;
