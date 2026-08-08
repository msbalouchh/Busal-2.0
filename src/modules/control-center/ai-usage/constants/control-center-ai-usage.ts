import { CONTROL_CENTER_ROUTES } from "@/modules/control-center/constants/routes";

export const CONTROL_CENTER_AI_USAGE_ROUTES = {
  hub: CONTROL_CENTER_ROUTES.ai,
} as const;

export const AI_USAGE_PAGE_SIZE = 10;

export const AI_USAGE_RANGE_OPTIONS = [7, 30, 90] as const;

export const AI_USAGE_SECTIONS = [
  {
    id: "overview",
    title: "Executive AI Overview",
    description: "Platform-wide AI requests, tokens, cost, and reliability.",
  },
  {
    id: "providers",
    title: "Provider Analytics",
    description: "Usage and cost breakdown by AI provider.",
  },
  {
    id: "models",
    title: "Model Analytics",
    description: "Token and request distribution by model.",
  },
  {
    id: "businesses",
    title: "Business Analytics",
    description: "AI consumption by business, tenant, and workspace.",
  },
  {
    id: "modules",
    title: "Module Analytics",
    description: "Tool and agent activity grouped by platform module.",
  },
  {
    id: "performance",
    title: "Performance",
    description: "Response times, success rates, and cache efficiency.",
  },
  {
    id: "costs",
    title: "Costs",
    description: "Prompt, completion, and total AI spend.",
  },
  {
    id: "trends",
    title: "Usage Trends",
    description: "Daily and monthly AI usage patterns.",
  },
  {
    id: "growth",
    title: "Growth",
    description: "Period-over-period AI adoption and expansion.",
  },
] as const;

export type AiUsageSectionId = (typeof AI_USAGE_SECTIONS)[number]["id"];

/** Estimated cost in pence per token when explicit cost is unavailable. */
export const AI_TOKEN_COST_PENCE_ESTIMATE = 0.002;
