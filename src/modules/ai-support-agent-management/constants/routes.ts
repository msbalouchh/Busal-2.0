import type { SupportPriority } from "@prisma/client";

export const AI_SUPPORT_AGENT_ROUTES = {
  dashboard: () => `/app/ai/support`,
  insights: () => `/app/ai/support/insights`,
  conversations: () => `/app/ai/support/conversations`,
  recommendations: () => `/app/ai/support/recommendations`,
  escalations: () => `/app/ai/support/escalations`,
  knowledge: () => `/app/ai/support/knowledge`,
  analytics: () => `/app/ai/support/analytics`,
  search: () => `/app/ai/support/search`,
} as const;

export const SUPPORT_PRIORITY_OPTIONS: Array<{ value: SupportPriority | "ALL"; label: string }> = [
  { value: "ALL", label: "All priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

export const SUPPORT_AGENT_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: AI_SUPPORT_AGENT_ROUTES.dashboard() },
  { id: "insights", label: "Insights", href: AI_SUPPORT_AGENT_ROUTES.insights() },
  { id: "conversations", label: "Conversations", href: AI_SUPPORT_AGENT_ROUTES.conversations() },
  {
    id: "recommendations",
    label: "Recommendations",
    href: AI_SUPPORT_AGENT_ROUTES.recommendations(),
  },
  { id: "escalations", label: "Escalations", href: AI_SUPPORT_AGENT_ROUTES.escalations() },
  { id: "knowledge", label: "Knowledge", href: AI_SUPPORT_AGENT_ROUTES.knowledge() },
  { id: "analytics", label: "Analytics", href: AI_SUPPORT_AGENT_ROUTES.analytics() },
  { id: "search", label: "Search", href: AI_SUPPORT_AGENT_ROUTES.search() },
] as const;
