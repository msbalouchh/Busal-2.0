import {
  BUILTIN_AGENT_LABELS,
  BUILTIN_AGENT_SLUGS,
  type BuiltinAgentSlug,
} from "@/modules/ai/constants/agent-slugs";
import { MEMORY_TYPES } from "@/modules/ai/constants/memory-types";
import type { AiAgentDefinition } from "@/modules/ai/types/agent";

const BASE_SYSTEM_PROMPT = "You are {{agentName}}, an AI agent for Busal OS. {{agentDescription}}";

function createBuiltinAgent(
  slug: BuiltinAgentSlug,
  description: string,
  toolSlugs: string[],
  memoryTypes: string[],
  priority: number,
): AiAgentDefinition {
  return {
    slug,
    name: BUILTIN_AGENT_LABELS[slug],
    description,
    systemPromptTemplate: BASE_SYSTEM_PROMPT,
    toolSlugs,
    memoryTypes,
    isBuiltin: true,
    isReplaceable: true,
    priority,
  };
}

export const BUILTIN_AGENTS: AiAgentDefinition[] = [
  createBuiltinAgent(
    BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT,
    "General business operations assistant for daily workspace tasks.",
    ["crm.lookup-customer", "reports.summary", "notifications.send"],
    [
      MEMORY_TYPES.CONVERSATION,
      MEMORY_TYPES.BUSINESS_CONTEXT,
      MEMORY_TYPES.WORKSPACE,
      MEMORY_TYPES.USER,
    ],
    100,
  ),
  createBuiltinAgent(
    BUILTIN_AGENT_SLUGS.SALES,
    "Supports pipeline management, lead follow-up, and revenue insights.",
    ["crm.lookup-customer", "crm.create-lead", "reports.sales-summary"],
    [MEMORY_TYPES.CONVERSATION, MEMORY_TYPES.BUSINESS_CONTEXT, MEMORY_TYPES.USER],
    90,
  ),
  createBuiltinAgent(
    BUILTIN_AGENT_SLUGS.MARKETING,
    "Campaign planning, audience segmentation, and performance analysis.",
    ["marketing.campaign-status", "reports.marketing-summary", "notifications.send"],
    [MEMORY_TYPES.CONVERSATION, MEMORY_TYPES.WORKSPACE, MEMORY_TYPES.AGENT],
    85,
  ),
  createBuiltinAgent(
    BUILTIN_AGENT_SLUGS.CUSTOMER_SUPPORT,
    "Handles customer inquiries, ticket triage, and resolution guidance.",
    ["crm.lookup-customer", "notifications.send", "reservations.lookup"],
    [MEMORY_TYPES.CONVERSATION, MEMORY_TYPES.USER, MEMORY_TYPES.BUSINESS_CONTEXT],
    80,
  ),
  createBuiltinAgent(
    BUILTIN_AGENT_SLUGS.RESERVATION,
    "Manages bookings, table availability, and reservation workflows.",
    ["reservations.lookup", "reservations.create", "pos.table-status"],
    [MEMORY_TYPES.CONVERSATION, MEMORY_TYPES.WORKSPACE, MEMORY_TYPES.BUSINESS_CONTEXT],
    75,
  ),
  createBuiltinAgent(
    BUILTIN_AGENT_SLUGS.INVENTORY,
    "Stock levels, reorder points, and supplier coordination.",
    ["inventory.stock-level", "inventory.reorder-suggestion", "reports.inventory-summary"],
    [MEMORY_TYPES.CONVERSATION, MEMORY_TYPES.BUSINESS_CONTEXT, MEMORY_TYPES.AGENT],
    70,
  ),
  createBuiltinAgent(
    BUILTIN_AGENT_SLUGS.FINANCE,
    "Payments, invoices, cash flow, and financial reporting.",
    ["finance.invoice-summary", "finance.payment-status", "reports.finance-summary"],
    [MEMORY_TYPES.CONVERSATION, MEMORY_TYPES.BUSINESS_CONTEXT, MEMORY_TYPES.WORKSPACE],
    65,
  ),
  createBuiltinAgent(
    BUILTIN_AGENT_SLUGS.ANALYTICS,
    "Business intelligence, KPI tracking, and trend analysis.",
    ["reports.summary", "reports.export", "developer.query-api"],
    [MEMORY_TYPES.CONVERSATION, MEMORY_TYPES.WORKSPACE, MEMORY_TYPES.AGENT],
    60,
  ),
  createBuiltinAgent(
    BUILTIN_AGENT_SLUGS.STAFF,
    "Staff scheduling, roles, and workforce management.",
    ["crm.lookup-customer", "notifications.send"],
    [MEMORY_TYPES.CONVERSATION, MEMORY_TYPES.USER, MEMORY_TYPES.BUSINESS_CONTEXT],
    55,
  ),
  createBuiltinAgent(
    BUILTIN_AGENT_SLUGS.OPERATIONS,
    "Cross-module operational coordination and workflow optimization.",
    [
      "pos.order-status",
      "inventory.stock-level",
      "reservations.lookup",
      "notifications.send",
      "reports.summary",
    ],
    [
      MEMORY_TYPES.CONVERSATION,
      MEMORY_TYPES.BUSINESS_CONTEXT,
      MEMORY_TYPES.WORKSPACE,
      MEMORY_TYPES.AGENT,
    ],
    50,
  ),
];
