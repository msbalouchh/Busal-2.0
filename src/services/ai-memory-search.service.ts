import "server-only";

/** Non-inference service — no parallel AI execution. */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  serializeMemory,
  validateMemorySearchQuery,
} from "@/modules/ai-memory-management/lib/ai-memory-validation";
import type {
  MemoryListResult,
  MemorySearchQuery,
} from "@/modules/ai-memory-management/types/ai-memory-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export async function searchMemories(
  ownerId: string,
  query: MemorySearchQuery = {},
): Promise<MemoryListResult> {
  const validated = validateMemorySearchQuery(query);
  const businessId = await getOwnedBusinessId(ownerId);
  const page = validated.page ?? 1;
  const pageSize = validated.pageSize ?? 20;

  const where: Prisma.AIMemoryWhereInput = {
    businessId,
    ...(validated.memoryType && validated.memoryType !== "ALL"
      ? { memoryType: validated.memoryType }
      : {}),
    ...(validated.agentId ? { agentId: validated.agentId } : {}),
    ...(validated.staffId ? { staffId: validated.staffId } : {}),
    ...(validated.customerId ? { customerId: validated.customerId } : {}),
    ...(validated.conversationId ? { conversationId: validated.conversationId } : {}),
  };

  if (validated.search?.trim() || validated.semanticQuery?.trim()) {
    const term = (validated.semanticQuery ?? validated.search ?? "").trim();
    where.OR = [
      { title: { contains: term, mode: "insensitive" } },
      { content: { contains: term, mode: "insensitive" } },
    ];
  }

  if (validated.entityType && validated.entityId) {
    where.references = {
      some: {
        entityType: validated.entityType,
        entityId: validated.entityId,
      },
    };
  }

  if (validated.contextScope === "business") {
    where.memoryType = "BUSINESS";
  } else if (validated.contextScope === "customer") {
    where.memoryType = "CUSTOMER";
  } else if (validated.contextScope === "staff") {
    where.memoryType = "STAFF";
  } else if (validated.contextScope === "conversation") {
    where.memoryType = { in: ["SESSION", "SHORT_TERM"] };
  }

  if (!validated.includeArchived) {
    where.NOT = [{ metadata: { path: ["archived"], equals: true } }];
  }

  const [total, items] = await Promise.all([
    prisma.aIMemory.count({ where }),
    prisma.aIMemory.findMany({
      where,
      orderBy: [{ importanceScore: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { references: true } } },
    }),
  ]);

  return {
    items: items.map(serializeMemory),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function searchMemoriesByConversation(
  ownerId: string,
  conversationId: string,
  limit = 20,
) {
  return searchMemories(ownerId, { conversationId, pageSize: limit });
}

export async function searchMemoriesByEntity(
  ownerId: string,
  entityType: string,
  entityId: string,
  limit = 20,
) {
  return searchMemories(ownerId, { entityType, entityId, pageSize: limit });
}

export async function searchBusinessMemories(ownerId: string, search?: string, limit = 20) {
  return searchMemories(ownerId, { contextScope: "business", search, pageSize: limit });
}
