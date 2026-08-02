import type { SkillCategory, SkillStatus } from "@prisma/client";

export const AI_SKILLS_ROUTES = {
  dashboard: () => `/app/ai/skills`,
  registry: () => `/app/ai/skills/registry`,
  categories: () => `/app/ai/skills/categories`,
  executions: () => `/app/ai/skills/executions`,
  search: () => `/app/ai/skills/search`,
  settings: () => `/app/ai/skills/settings`,
  skill: (skillId: string) => `/app/ai/skills/${skillId}`,
} as const;

export const SKILL_STATUS_OPTIONS: Array<{ value: SkillStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "DISABLED", label: "Disabled" },
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
];

export const SKILL_CATEGORY_OPTIONS: Array<{ value: SkillCategory | "ALL"; label: string }> = [
  { value: "ALL", label: "All categories" },
  { value: "BUSINESS", label: "Business" },
  { value: "CUSTOMER", label: "Customer" },
  { value: "STAFF", label: "Staff" },
  { value: "REPORTING", label: "Reporting" },
  { value: "MARKETING", label: "Marketing" },
  { value: "OPERATIONS", label: "Operations" },
  { value: "FINANCE", label: "Finance" },
  { value: "SYSTEM", label: "System" },
  { value: "CUSTOM", label: "Custom" },
];

export const SKILLS_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: AI_SKILLS_ROUTES.dashboard() },
  { id: "registry", label: "Registry", href: AI_SKILLS_ROUTES.registry() },
  { id: "categories", label: "Categories", href: AI_SKILLS_ROUTES.categories() },
  { id: "executions", label: "Executions", href: AI_SKILLS_ROUTES.executions() },
  { id: "search", label: "Search", href: AI_SKILLS_ROUTES.search() },
  { id: "settings", label: "Settings", href: AI_SKILLS_ROUTES.settings() },
] as const;
