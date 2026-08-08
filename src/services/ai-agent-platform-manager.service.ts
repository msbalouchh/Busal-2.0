import "server-only";

/** Non-inference service — no parallel AI execution. */

import type { AgentCategory, AgentStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  serializeAgent,
  slugifyAgent,
  validateAgentInput,
  validateAgentListQuery,
  validateCapabilityInput,
  validateToolInput,
} from "@/modules/ai-agent-platform-management/lib/ai-agent-platform-validation";
import type {
  AgentListQuery,
  AgentListResult,
  PlatformAgentCapabilityInput,
  PlatformAgentCapabilityRecord,
  PlatformAgentInput,
  PlatformAgentRecord,
  PlatformAgentToolInput,
  PlatformAgentToolRecord,
} from "@/modules/ai-agent-platform-management/types/ai-agent-platform-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

async function logAgentPlatformAudit(
  businessId: string,
  staffId: string | null,
  entityType: string,
  entityId: string,
  action: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await prisma.aiAgentAuditLog.create({
    data: {
      businessId,
      staffId,
      entityType,
      entityId,
      action,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

export async function listPlatformAgents(
  ownerId: string,
  query: AgentListQuery = {},
): Promise<AgentListResult> {
  validateAgentListQuery(query);
  const businessId = await getOwnedBusinessId(ownerId);
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const where: Prisma.AIAgentWhereInput = {
    businessId,
    ...(query.status && query.status !== "ALL" ? { status: query.status } : {}),
    ...(query.category && query.category !== "ALL" ? { category: query.category } : {}),
    ...(query.search?.trim()
      ? {
          OR: [
            { name: { contains: query.search.trim(), mode: "insensitive" } },
            { slug: { contains: query.search.trim(), mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.aIAgent.count({ where }),
    prisma.aIAgent.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { tools: true, capabilities: true } } },
    }),
  ]);

  return {
    items: items.map(serializeAgent),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getPlatformAgent(
  ownerId: string,
  agentId: string,
): Promise<PlatformAgentRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const agent = await prisma.aIAgent.findFirst({
    where: { id: agentId, businessId },
    include: { _count: { select: { tools: true, capabilities: true } } },
  });
  if (!agent) throw new Error("Agent not found");
  return serializeAgent(agent);
}

export async function createPlatformAgent(
  ownerId: string,
  input: PlatformAgentInput,
  staffId?: string | null,
): Promise<PlatformAgentRecord> {
  validateAgentInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  const slug = input.slug?.trim() || slugifyAgent(input.name);

  const agent = await prisma.aIAgent.create({
    data: {
      businessId,
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      category: input.category ?? "CUSTOM",
      status: input.status ?? "DRAFT",
      version: input.version ?? "1.0.0",
      icon: input.icon ?? null,
      color: input.color ?? null,
      configuration: (input.configuration ?? {}) as Prisma.InputJsonValue,
      permissions: (input.permissions ?? []) as Prisma.InputJsonValue,
    },
    include: { _count: { select: { tools: true, capabilities: true } } },
  });

  await logAgentPlatformAudit(businessId, staffId ?? null, "platform_agent", agent.id, "CREATE");
  return serializeAgent(agent);
}

export async function updatePlatformAgent(
  ownerId: string,
  agentId: string,
  input: Partial<PlatformAgentInput>,
  staffId?: string | null,
): Promise<PlatformAgentRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.aIAgent.findFirst({ where: { id: agentId, businessId } });
  if (!existing) throw new Error("Agent not found");
  if (input.name !== undefined) validateAgentInput({ ...input, name: input.name });

  const agent = await prisma.aIAgent.update({
    where: { id: agentId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.slug !== undefined ? { slug: input.slug.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.version !== undefined ? { version: input.version } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.configuration !== undefined
        ? { configuration: input.configuration as Prisma.InputJsonValue }
        : {}),
      ...(input.permissions !== undefined
        ? { permissions: input.permissions as Prisma.InputJsonValue }
        : {}),
    },
    include: { _count: { select: { tools: true, capabilities: true } } },
  });

  await logAgentPlatformAudit(businessId, staffId ?? null, "platform_agent", agent.id, "UPDATE");
  return serializeAgent(agent);
}

export async function deletePlatformAgent(
  ownerId: string,
  agentId: string,
  staffId?: string | null,
): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.aIAgent.findFirst({ where: { id: agentId, businessId } });
  if (!existing) throw new Error("Agent not found");

  await prisma.aIAgent.update({
    where: { id: agentId },
    data: { status: "ARCHIVED" },
  });

  await logAgentPlatformAudit(businessId, staffId ?? null, "platform_agent", agentId, "ARCHIVE");
}

export async function listAgentTools(
  ownerId: string,
  agentId: string,
): Promise<PlatformAgentToolRecord[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  const agent = await prisma.aIAgent.findFirst({ where: { id: agentId, businessId } });
  if (!agent) throw new Error("Agent not found");

  const tools = await prisma.aIAgentTool.findMany({
    where: { agentId },
    orderBy: { createdAt: "asc" },
  });

  return tools.map((tool) => ({
    id: tool.id,
    agentId: tool.agentId,
    name: tool.name,
    description: tool.description,
    toolKey: tool.toolKey,
    enabled: tool.enabled,
    configuration: (tool.configuration as Record<string, unknown>) ?? {},
    createdAt: tool.createdAt.toISOString(),
  }));
}

export async function assignAgentTool(
  ownerId: string,
  agentId: string,
  input: PlatformAgentToolInput,
): Promise<PlatformAgentToolRecord> {
  validateToolInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  const agent = await prisma.aIAgent.findFirst({ where: { id: agentId, businessId } });
  if (!agent) throw new Error("Agent not found");

  const tool = await prisma.aIAgentTool.upsert({
    where: { agentId_toolKey: { agentId, toolKey: input.toolKey.trim() } },
    create: {
      agentId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      toolKey: input.toolKey.trim(),
      enabled: input.enabled ?? true,
      configuration: (input.configuration ?? {}) as Prisma.InputJsonValue,
    },
    update: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      enabled: input.enabled ?? true,
      configuration: (input.configuration ?? {}) as Prisma.InputJsonValue,
    },
  });

  return {
    id: tool.id,
    agentId: tool.agentId,
    name: tool.name,
    description: tool.description,
    toolKey: tool.toolKey,
    enabled: tool.enabled,
    configuration: (tool.configuration as Record<string, unknown>) ?? {},
    createdAt: tool.createdAt.toISOString(),
  };
}

export async function listAgentCapabilities(
  ownerId: string,
  agentId: string,
): Promise<PlatformAgentCapabilityRecord[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  const agent = await prisma.aIAgent.findFirst({ where: { id: agentId, businessId } });
  if (!agent) throw new Error("Agent not found");

  const capabilities = await prisma.aIAgentCapability.findMany({
    where: { agentId },
    orderBy: { name: "asc" },
  });

  return capabilities.map((capability) => ({
    id: capability.id,
    agentId: capability.agentId,
    name: capability.name,
    description: capability.description,
    enabled: capability.enabled,
  }));
}

export async function upsertAgentCapability(
  ownerId: string,
  agentId: string,
  input: PlatformAgentCapabilityInput,
): Promise<PlatformAgentCapabilityRecord> {
  validateCapabilityInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  const agent = await prisma.aIAgent.findFirst({ where: { id: agentId, businessId } });
  if (!agent) throw new Error("Agent not found");

  const capability = await prisma.aIAgentCapability.upsert({
    where: { agentId_name: { agentId, name: input.name.trim() } },
    create: {
      agentId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      enabled: input.enabled ?? true,
    },
    update: {
      description: input.description?.trim() || null,
      enabled: input.enabled ?? true,
    },
  });

  return {
    id: capability.id,
    agentId: capability.agentId,
    name: capability.name,
    description: capability.description,
    enabled: capability.enabled,
  };
}

export async function getPlatformAgentDashboardStats(ownerId: string): Promise<{
  totalAgents: number;
  activeAgents: number;
  draftAgents: number;
  totalExecutions: number;
  failedExecutions: number;
}> {
  const businessId = await getOwnedBusinessId(ownerId);
  const [totalAgents, activeAgents, draftAgents, totalExecutions, failedExecutions] =
    await Promise.all([
      prisma.aIAgent.count({ where: { businessId, status: { not: "ARCHIVED" } } }),
      prisma.aIAgent.count({ where: { businessId, status: "ACTIVE" } }),
      prisma.aIAgent.count({ where: { businessId, status: "DRAFT" } }),
      prisma.aIAgentExecution.count({ where: { businessId } }),
      prisma.aIAgentExecution.count({ where: { businessId, status: "FAILED" } }),
    ]);

  return { totalAgents, activeAgents, draftAgents, totalExecutions, failedExecutions };
}

export type { AgentCategory, AgentStatus };
