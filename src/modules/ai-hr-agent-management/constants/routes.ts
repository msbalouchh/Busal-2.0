import type { HRPriority } from "@prisma/client";

export const AI_HR_AGENT_ROUTES = {
  dashboard: () => `/app/ai/hr`,
  insights: () => `/app/ai/hr/insights`,
  recruitment: () => `/app/ai/hr/recruitment`,
  performance: () => `/app/ai/hr/performance`,
  attendance: () => `/app/ai/hr/attendance`,
  training: () => `/app/ai/hr/training`,
  recommendations: () => `/app/ai/hr/recommendations`,
  search: () => `/app/ai/hr/search`,
} as const;

export const HR_PRIORITY_OPTIONS: Array<{ value: HRPriority | "ALL"; label: string }> = [
  { value: "ALL", label: "All priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

export const HR_INSIGHT_CATEGORY_OPTIONS = [
  { value: "ALL", label: "All categories" },
  { value: "performance", label: "Performance" },
  { value: "attendance", label: "Attendance" },
  { value: "leave", label: "Leave" },
  { value: "shift", label: "Shift" },
  { value: "recruitment", label: "Recruitment" },
  { value: "training", label: "Training" },
  { value: "retention", label: "Retention" },
  { value: "engagement", label: "Engagement" },
  { value: "policy", label: "Policy" },
] as const;

export const HR_AGENT_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: AI_HR_AGENT_ROUTES.dashboard() },
  { id: "insights", label: "Employee Insights", href: AI_HR_AGENT_ROUTES.insights() },
  { id: "recruitment", label: "Recruitment", href: AI_HR_AGENT_ROUTES.recruitment() },
  { id: "performance", label: "Performance", href: AI_HR_AGENT_ROUTES.performance() },
  { id: "attendance", label: "Attendance", href: AI_HR_AGENT_ROUTES.attendance() },
  { id: "training", label: "Training", href: AI_HR_AGENT_ROUTES.training() },
  { id: "recommendations", label: "Recommendations", href: AI_HR_AGENT_ROUTES.recommendations() },
  { id: "search", label: "Search", href: AI_HR_AGENT_ROUTES.search() },
] as const;
