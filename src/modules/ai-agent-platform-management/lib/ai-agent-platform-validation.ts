import type { AgentCategory, AgentStatus, Prisma } from "@prisma/client";

import type {
  AgentListQuery,
  PlatformAgentCapabilityInput,
  PlatformAgentInput,
  PlatformAgentRecord,
  PlatformAgentToolInput,
} from "@/modules/ai-agent-platform-management/types/ai-agent-platform-types";

export function slugifyAgent(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function validateAgentInput(input: PlatformAgentInput): void {
  if (!input.name?.trim()) throw new Error("Agent name is required");
  if (input.slug && !/^[a-z0-9-]+$/.test(input.slug)) {
    throw new Error("Slug must contain only lowercase letters, numbers, and hyphens");
  }
}

export function validateAgentListQuery(query: AgentListQuery): void {
  if (query.page !== undefined && query.page < 1) throw new Error("Invalid page");
  if (query.pageSize !== undefined && (query.pageSize < 1 || query.pageSize > 100)) {
    throw new Error("Page size must be between 1 and 100");
  }
}

export function validateToolInput(input: PlatformAgentToolInput): void {
  if (!input.name?.trim()) throw new Error("Tool name is required");
  if (!input.toolKey?.trim()) throw new Error("Tool key is required");
}

export function validateCapabilityInput(input: PlatformAgentCapabilityInput): void {
  if (!input.name?.trim()) throw new Error("Capability name is required");
}

export function normalizeAgentStatus(status?: string): AgentStatus | "ALL" {
  if (!status || status === "ALL") return "ALL";
  if (["ACTIVE", "DISABLED", "DRAFT", "ARCHIVED"].includes(status)) {
    return status as AgentStatus;
  }
  throw new Error("Invalid agent status");
}

export function normalizeAgentCategory(category?: string): AgentCategory | "ALL" {
  if (!category || category === "ALL") return "ALL";
  if (["BUSINESS", "OPERATIONS", "SUPPORT", "MARKETING", "FINANCE", "CUSTOM"].includes(category)) {
    return category as AgentCategory;
  }
  throw new Error("Invalid agent category");
}

export function serializeAgent(agent: {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  description: string | null;
  category: AgentCategory;
  status: AgentStatus;
  version: string;
  icon: string | null;
  color: string | null;
  configuration: Prisma.JsonValue;
  permissions: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  _count?: { tools: number; capabilities: number };
}): PlatformAgentRecord {
  return {
    id: agent.id,
    businessId: agent.businessId,
    name: agent.name,
    slug: agent.slug,
    description: agent.description,
    category: agent.category,
    status: agent.status,
    version: agent.version,
    icon: agent.icon,
    color: agent.color,
    configuration: (agent.configuration as Record<string, unknown>) ?? {},
    permissions: (agent.permissions as string[]) ?? [],
    createdAt: agent.createdAt.toISOString(),
    updatedAt: agent.updatedAt.toISOString(),
    toolCount: agent._count?.tools,
    capabilityCount: agent._count?.capabilities,
  };
}
