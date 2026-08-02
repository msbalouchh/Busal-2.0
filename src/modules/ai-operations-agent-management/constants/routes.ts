import type { OperationPriority } from "@prisma/client";

export const AI_OPERATIONS_AGENT_ROUTES = {
  dashboard: () => `/app/ai/operations`,
  health: () => `/app/ai/operations/health`,
  workflows: () => `/app/ai/operations/workflows`,
  resources: () => `/app/ai/operations/resources`,
  efficiency: () => `/app/ai/operations/efficiency`,
  risks: () => `/app/ai/operations/risks`,
  recommendations: () => `/app/ai/operations/recommendations`,
  search: () => `/app/ai/operations/search`,
} as const;

export const OPERATION_PRIORITY_OPTIONS: Array<{
  value: OperationPriority | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "All priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

export const OPERATION_INSIGHT_CATEGORY_OPTIONS = [
  { value: "ALL", label: "All categories" },
  { value: "workflow", label: "Workflow" },
  { value: "efficiency", label: "Efficiency" },
  { value: "resource", label: "Resource" },
  { value: "inventory", label: "Inventory" },
  { value: "order", label: "Order Flow" },
  { value: "reservation", label: "Reservation" },
  { value: "queue", label: "Queue" },
  { value: "bottleneck", label: "Bottleneck" },
  { value: "risk", label: "Risk" },
  { value: "capacity", label: "Capacity" },
  { value: "health", label: "Operational Health" },
  { value: "trend", label: "Trend" },
] as const;

export const OPERATIONS_AGENT_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: AI_OPERATIONS_AGENT_ROUTES.dashboard() },
  { id: "health", label: "Operational Health", href: AI_OPERATIONS_AGENT_ROUTES.health() },
  { id: "workflows", label: "Workflows", href: AI_OPERATIONS_AGENT_ROUTES.workflows() },
  { id: "resources", label: "Resources", href: AI_OPERATIONS_AGENT_ROUTES.resources() },
  { id: "efficiency", label: "Efficiency", href: AI_OPERATIONS_AGENT_ROUTES.efficiency() },
  { id: "risks", label: "Risk Center", href: AI_OPERATIONS_AGENT_ROUTES.risks() },
  {
    id: "recommendations",
    label: "Recommendations",
    href: AI_OPERATIONS_AGENT_ROUTES.recommendations(),
  },
  { id: "search", label: "Search", href: AI_OPERATIONS_AGENT_ROUTES.search() },
] as const;
