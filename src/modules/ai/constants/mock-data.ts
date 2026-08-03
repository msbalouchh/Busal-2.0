import { BUILTIN_AGENT_SLUGS } from "@/modules/ai/constants/agent-slugs";
import { MEMORY_TYPES } from "@/modules/ai/constants/memory-types";
import type { AiMemoryEntry } from "@/modules/ai/types/memory";

export const DEFAULT_MOCK_AI_USER_ID = "user-harbour-owner";

export const DEFAULT_MOCK_AI_SCOPE = {
  tenantId: "tenant-harbour",
  workspaceId: "ws-harbour-kitchen",
  businessId: "biz-harbour-kitchen",
  branchId: "branch-harbour-main",
} as const;

export const MOCK_AI_MEMORY_ENTRIES: Omit<AiMemoryEntry, "id" | "createdAt" | "updatedAt">[] = [
  {
    type: MEMORY_TYPES.BUSINESS_CONTEXT,
    key: "industry",
    value: "Restaurant — Harbour Kitchen, London",
    tenantId: "tenant-harbour",
    workspaceId: "ws-harbour-kitchen",
    businessId: "biz-harbour-kitchen",
    userId: null,
    agentSlug: null,
    conversationId: null,
    metadata: { source: "mock" },
  },
  {
    type: MEMORY_TYPES.WORKSPACE,
    key: "active-modules",
    value: "POS, Reservations, Kitchen, Inventory, CRM",
    tenantId: "tenant-harbour",
    workspaceId: "ws-harbour-kitchen",
    businessId: "biz-harbour-kitchen",
    userId: null,
    agentSlug: null,
    conversationId: null,
  },
  {
    type: MEMORY_TYPES.USER,
    key: "preferred-agent",
    value: BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT,
    tenantId: "tenant-harbour",
    workspaceId: "ws-harbour-kitchen",
    businessId: "biz-harbour-kitchen",
    userId: DEFAULT_MOCK_AI_USER_ID,
    agentSlug: null,
    conversationId: null,
  },
  {
    type: MEMORY_TYPES.AGENT,
    key: "sales-agent:last-insight",
    value: "Pipeline value increased 12% this week.",
    tenantId: "tenant-harbour",
    workspaceId: "ws-harbour-kitchen",
    businessId: "biz-harbour-kitchen",
    userId: null,
    agentSlug: BUILTIN_AGENT_SLUGS.SALES,
    conversationId: null,
  },
  {
    type: MEMORY_TYPES.CONVERSATION,
    key: "greeting",
    value: "Welcome back to Harbour Kitchen workspace.",
    tenantId: "tenant-harbour",
    workspaceId: "ws-harbour-kitchen",
    businessId: "biz-harbour-kitchen",
    userId: DEFAULT_MOCK_AI_USER_ID,
    agentSlug: BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT,
    conversationId: "conv-mock-welcome",
  },
];

export const MOCK_AI_RESPONSES: Record<string, string> = {
  [BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT]:
    "I'm your Business Assistant. I can help with daily operations, summaries, and cross-module tasks. What would you like to focus on?",
  [BUILTIN_AGENT_SLUGS.SALES]:
    "Sales pipeline looks healthy. You have 12 active opportunities worth £84k. Want me to highlight at-risk deals?",
  [BUILTIN_AGENT_SLUGS.MARKETING]:
    "Your active campaigns are performing above benchmark. CTR is 4.2% on the spring promotion.",
  [BUILTIN_AGENT_SLUGS.CUSTOMER_SUPPORT]:
    "I can help triage customer inquiries. Share a ticket ID or describe the issue.",
  [BUILTIN_AGENT_SLUGS.RESERVATION]:
    "You have 3 reservations today. Main dining is 78% booked for dinner service.",
  [BUILTIN_AGENT_SLUGS.INVENTORY]:
    "5 items are below reorder point. Shall I prepare a purchase order draft?",
  [BUILTIN_AGENT_SLUGS.FINANCE]:
    "Net margin is 18.4% this month. £12,450 outstanding across 8 invoices.",
  [BUILTIN_AGENT_SLUGS.ANALYTICS]:
    "Revenue is up 8% week-over-week. Top performer: harbourfront branch.",
  [BUILTIN_AGENT_SLUGS.STAFF]:
    "Your team has 2 open shifts this week. 14 staff members are active.",
  [BUILTIN_AGENT_SLUGS.OPERATIONS]:
    "Operations summary: 47 orders in progress, kitchen load moderate, no critical alerts.",
};
