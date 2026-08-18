import "server-only";

/** Non-inference service — no parallel AI execution. */

import type { MemoryType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { serializeMemory } from "@/modules/ai-memory-management/lib/ai-memory-validation";
import type { MemoryRecord } from "@/modules/ai-memory-management/types/ai-memory-types";
import { rankMemories } from "@/services/ai-memory-ranking.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export async function retrieveMemoriesByBusinessId(
  businessId: string,
  memoryType: MemoryType,
  limit = 20,
): Promise<MemoryRecord[]> {
  const items = await prisma.aIMemory.findMany({
    where: {
      businessId,
      memoryType,
      NOT: [{ metadata: { path: ["archived"], equals: true } }],
    },
    orderBy: [{ importanceScore: "desc" }, { updatedAt: "desc" }],
    take: limit,
    include: { _count: { select: { references: true } } },
  });

  return rankMemories(items.map(serializeMemory));
}

export async function retrieveMemoriesByType(
  ownerId: string,
  memoryType: MemoryType,
  limit = 20,
): Promise<MemoryRecord[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  const items = await prisma.aIMemory.findMany({
    where: {
      businessId,
      memoryType,
      NOT: [{ metadata: { path: ["archived"], equals: true } }],
    },
    orderBy: [{ importanceScore: "desc" }, { updatedAt: "desc" }],
    take: limit,
    include: { _count: { select: { references: true } } },
  });

  return rankMemories(items.map(serializeMemory));
}

export async function retrievePinnedMemories(ownerId: string, limit = 20): Promise<MemoryRecord[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  const items = await prisma.aIMemory.findMany({
    where: {
      businessId,
      metadata: { path: ["pinned"], equals: true },
      NOT: [{ metadata: { path: ["archived"], equals: true } }],
    },
    orderBy: [{ importanceScore: "desc" }, { updatedAt: "desc" }],
    take: limit,
    include: { _count: { select: { references: true } } },
  });

  return items.map(serializeMemory);
}

export async function retrieveAgentMemories(
  ownerId: string,
  agentId: string,
  limit = 20,
): Promise<MemoryRecord[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  const items = await prisma.aIMemory.findMany({
    where: {
      businessId,
      agentId,
      NOT: [{ metadata: { path: ["archived"], equals: true } }],
    },
    orderBy: [{ importanceScore: "desc" }, { updatedAt: "desc" }],
    take: limit,
    include: { _count: { select: { references: true } } },
  });

  return rankMemories(items.map(serializeMemory));
}

export async function retrieveSharedMemories(ownerId: string, limit = 20): Promise<MemoryRecord[]> {
  return retrieveMemoriesByType(ownerId, "BUSINESS", limit);
}

export async function retrieveWorkingMemoriesByBusinessId(
  businessId: string,
  conversationId: string,
  limit = 12,
): Promise<MemoryRecord[]> {
  const items = await prisma.aIMemory.findMany({
    where: {
      businessId,
      conversationId,
      memoryType: { in: ["SHORT_TERM", "SESSION"] },
      NOT: [{ metadata: { path: ["archived"], equals: true } }],
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: { _count: { select: { references: true } } },
  });

  return items.map(serializeMemory);
}

export async function retrieveWorkingMemories(
  ownerId: string,
  conversationId: string,
  limit = 12,
): Promise<MemoryRecord[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  const items = await prisma.aIMemory.findMany({
    where: {
      businessId,
      conversationId,
      memoryType: { in: ["SHORT_TERM", "SESSION"] },
      NOT: [{ metadata: { path: ["archived"], equals: true } }],
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: { _count: { select: { references: true } } },
  });

  return items.map(serializeMemory);
}
