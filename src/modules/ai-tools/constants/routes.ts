import { AI_KNOWLEDGE_ROUTES } from "@/modules/ai-knowledge/constants/routes";

export const AI_TOOLS_ROUTES = {
  overview: "/dashboard/ai-tools",
  registry: "/dashboard/ai-tools/registry",
  executions: "/dashboard/ai-tools/executions",
  discovery: "/dashboard/ai-tools/discovery",
} as const;

export const AI_TOOLS_NAV_ITEMS = [
  { label: "Overview", href: AI_TOOLS_ROUTES.overview },
  { label: "Knowledge", href: AI_KNOWLEDGE_ROUTES.overview },
  { label: "Registry", href: AI_TOOLS_ROUTES.registry },
  { label: "Executions", href: AI_TOOLS_ROUTES.executions },
  { label: "Discovery", href: AI_TOOLS_ROUTES.discovery },
] as const;

export const DEFAULT_RETRY_POLICY = {
  maxRetries: 2,
  timeoutMs: 30_000,
  backoffMs: 500,
} as const;
