export const MEMORY_TYPES = {
  CONVERSATION: "conversation",
  BUSINESS_CONTEXT: "business-context",
  WORKSPACE: "workspace",
  USER: "user",
  AGENT: "agent",
} as const;

export type MemoryType = (typeof MEMORY_TYPES)[keyof typeof MEMORY_TYPES];

export const MEMORY_TYPE_LABELS: Record<MemoryType, string> = {
  conversation: "Conversation Memory",
  "business-context": "Business Context Memory",
  workspace: "Workspace Memory",
  user: "User Memory",
  agent: "Agent Memory",
};

export const ALL_MEMORY_TYPES = Object.values(MEMORY_TYPES);
