import type { MemoryType } from "@prisma/client";

export const AI_MEMORY_ROUTES = {
  dashboard: () => `/app/ai/memory`,
  explorer: () => `/app/ai/memory/explorer`,
  search: () => `/app/ai/memory/search`,
  timeline: () => `/app/ai/memory/timeline`,
  collections: () => `/app/ai/memory/collections`,
  analytics: () => `/app/ai/memory/analytics`,
  memory: (memoryId: string) => `/app/ai/memory/${memoryId}`,
} as const;

export const MEMORY_TYPE_OPTIONS: Array<{ value: MemoryType | "ALL"; label: string }> = [
  { value: "ALL", label: "All types" },
  { value: "SHORT_TERM", label: "Short-term" },
  { value: "LONG_TERM", label: "Long-term" },
  { value: "SESSION", label: "Session" },
  { value: "BUSINESS", label: "Business" },
  { value: "CUSTOMER", label: "Customer" },
  { value: "STAFF", label: "Staff" },
  { value: "KNOWLEDGE", label: "Knowledge" },
  { value: "SEMANTIC", label: "Semantic" },
];

export const MEMORY_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: AI_MEMORY_ROUTES.dashboard() },
  { id: "explorer", label: "Explorer", href: AI_MEMORY_ROUTES.explorer() },
  { id: "search", label: "Search", href: AI_MEMORY_ROUTES.search() },
  { id: "timeline", label: "Timeline", href: AI_MEMORY_ROUTES.timeline() },
  { id: "collections", label: "Collections", href: AI_MEMORY_ROUTES.collections() },
  { id: "analytics", label: "Analytics", href: AI_MEMORY_ROUTES.analytics() },
] as const;
