export const PLATFORM_CEO_ROUTES = {
  hub: "/control-center/ceo",
  reports: "/control-center/ceo/reports",
} as const;

export const PLATFORM_CEO_STORE_SETTING_KEY = "platform.ceo.store";

export const PLATFORM_CEO_CONVERSATION_PAGE_SIZE = 50;

export const PLATFORM_CEO_MAX_AUDIT_ENTRIES = 500;

export const PLATFORM_CEO_MAX_MEMORY_ENTRIES = 50;

export const PLATFORM_CEO_MAX_REPORTS = 100;

export const PLATFORM_CEO_SUGGESTED_PROMPTS = [
  {
    id: "platform-performance",
    label: "How is Busal performing?",
    prompt: "How is Busal performing?",
  },
  {
    id: "what-changed",
    label: "What changed today?",
    prompt: "What changed today?",
  },
  {
    id: "business-attention",
    label: "Businesses needing attention",
    prompt: "Which businesses require my attention?",
  },
  {
    id: "mrr-decrease",
    label: "Why did MRR decrease?",
    prompt: "Why did MRR decrease?",
  },
  {
    id: "upgrade-ready",
    label: "Upgrade-ready businesses",
    prompt: "Which businesses are ready for upgrade?",
  },
  {
    id: "operational-risk",
    label: "Biggest operational risk",
    prompt: "What is our biggest operational risk?",
  },
  {
    id: "module-attention",
    label: "Module attention",
    prompt: "Which module needs attention?",
  },
  {
    id: "bottlenecks",
    label: "Platform bottlenecks",
    prompt: "Show platform bottlenecks.",
  },
  {
    id: "losing-money",
    label: "Revenue leakage",
    prompt: "Where are we losing money?",
  },
  {
    id: "today-priorities",
    label: "Today's priorities",
    prompt: "What should I do today?",
  },
] as const;

export const PLATFORM_CEO_AGENT_SLUG = "platform-ceo";
