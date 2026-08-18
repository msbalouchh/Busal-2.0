import { AI_AGENTS_ROUTES } from "@/modules/ai-agents/constants/routes";
import { AI_AUTOMATION_ROUTES } from "@/modules/ai-automation/constants/routes";
import { AI_KNOWLEDGE_ROUTES } from "@/modules/ai-knowledge/constants/routes";
import { AI_TOOLS_ROUTES } from "@/modules/ai-tools/constants/routes";

export const AI_PLATFORM_ROUTES = {
  overview: "/dashboard/ai-platform",
  controlCenter: "/dashboard/ai-platform/control-center",
  channels: "/dashboard/ai-platform/channels",
  operations: "/dashboard/ai-platform/operations",
  assistant: "/dashboard/ai-platform/assistant",
  agents: "/dashboard/ai-platform/agents",
  knowledge: "/dashboard/ai-platform/knowledge",
  automation: "/dashboard/ai-platform/automation",
  tools: "/dashboard/ai-platform/tools",
  analytics: "/dashboard/ai-platform/analytics",
  settings: "/dashboard/ai-platform/settings",
  agentsModule: AI_AGENTS_ROUTES.overview,
  knowledgeModule: AI_KNOWLEDGE_ROUTES.overview,
  automationModule: AI_AUTOMATION_ROUTES.overview,
  toolsModule: AI_TOOLS_ROUTES.overview,
} as const;

export const AI_PLATFORM_NAV_ITEMS = [
  { label: "Overview", href: AI_PLATFORM_ROUTES.overview },
  { label: "Control Center", href: AI_PLATFORM_ROUTES.controlCenter },
  { label: "Channels", href: AI_PLATFORM_ROUTES.channels },
  { label: "Operations", href: AI_PLATFORM_ROUTES.operations },
  { label: "Assistant", href: AI_PLATFORM_ROUTES.assistant },
  { label: "Agents", href: AI_PLATFORM_ROUTES.agents },
  { label: "Knowledge", href: AI_PLATFORM_ROUTES.knowledge },
  { label: "Automation", href: AI_PLATFORM_ROUTES.automation },
  { label: "Tools", href: AI_PLATFORM_ROUTES.tools },
  { label: "Analytics", href: AI_PLATFORM_ROUTES.analytics },
  { label: "Settings", href: AI_PLATFORM_ROUTES.settings },
] as const;

export const AI_ASSISTANT_SUGGESTED_PROMPTS = [
  "Summarize our latest SOPs",
  "What are our refund policies?",
  "Find training material for new staff",
  "Which documents mention allergen handling?",
  "Show knowledge about customer onboarding",
] as const;

export const AI_PLATFORM_SETTINGS_KEYS = [
  "ai.default_model",
  "ai.temperature",
  "ai.token_limit",
  "ai.usage_limit",
  "ai.privacy_redact_pii",
  "ai.knowledge_auto_index",
] as const;
