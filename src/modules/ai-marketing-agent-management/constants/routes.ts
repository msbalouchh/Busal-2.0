import type { MarketingPriority } from "@prisma/client";

export const AI_MARKETING_AGENT_ROUTES = {
  dashboard: () => `/app/ai/marketing`,
  insights: () => `/app/ai/marketing/insights`,
  audience: () => `/app/ai/marketing/audience`,
  segments: () => `/app/ai/marketing/segments`,
  recommendations: () => `/app/ai/marketing/recommendations`,
  performance: () => `/app/ai/marketing/performance`,
  timeline: () => `/app/ai/marketing/timeline`,
  search: () => `/app/ai/marketing/search`,
} as const;

export const MARKETING_PRIORITY_OPTIONS: Array<{
  value: MarketingPriority | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "All priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

export const INSIGHT_CATEGORY_OPTIONS = [
  { value: "ALL", label: "All categories" },
  { value: "campaign", label: "Campaign" },
  { value: "audience", label: "Audience" },
  { value: "segment", label: "Segment" },
  { value: "promotion", label: "Promotion" },
  { value: "retention", label: "Retention" },
  { value: "engagement", label: "Engagement" },
  { value: "conversion", label: "Conversion" },
  { value: "performance", label: "Performance" },
  { value: "opportunity", label: "Opportunity" },
] as const;

export const MARKETING_AGENT_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: AI_MARKETING_AGENT_ROUTES.dashboard() },
  { id: "insights", label: "Insights", href: AI_MARKETING_AGENT_ROUTES.insights() },
  { id: "audience", label: "Audience", href: AI_MARKETING_AGENT_ROUTES.audience() },
  { id: "segments", label: "Segments", href: AI_MARKETING_AGENT_ROUTES.segments() },
  {
    id: "recommendations",
    label: "Recommendations",
    href: AI_MARKETING_AGENT_ROUTES.recommendations(),
  },
  { id: "performance", label: "Performance", href: AI_MARKETING_AGENT_ROUTES.performance() },
  { id: "timeline", label: "Timeline", href: AI_MARKETING_AGENT_ROUTES.timeline() },
  { id: "search", label: "Search", href: AI_MARKETING_AGENT_ROUTES.search() },
] as const;
