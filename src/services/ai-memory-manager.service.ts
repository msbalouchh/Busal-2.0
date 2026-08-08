import "server-only";

/** Non-inference service — no parallel AI execution. */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  serializeMemory,
  serializeMemoryCollection,
  validateCollectionInput,
  validateMemoryListQuery,
} from "@/modules/ai-memory-management/lib/ai-memory-validation";
import type {
  MemoryCollectionInput,
  MemoryCollectionRecord,
  MemoryDashboardStats,
  MemoryListQuery,
  MemoryListResult,
  MemoryMergeInput,
  MemoryRecord,
  MemoryTimelineEntry,
} from "@/modules/ai-memory-management/types/ai-memory-types";
import { createMemory, deleteMemory, getMemory } from "@/services/ai-memory.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

function buildMemoryWhere(businessId: string, query: MemoryListQuery): Prisma.AIMemoryWhereInput {
  const where: Prisma.AIMemoryWhereInput = {
    businessId,
    ...(query.memoryType && query.memoryType !== "ALL" ? { memoryType: query.memoryType } : {}),
    ...(query.agentId ? { agentId: query.agentId } : {}),
    ...(query.staffId ? { staffId: query.staffId } : {}),
    ...(query.customerId ? { customerId: query.customerId } : {}),
    ...(query.conversationId ? { conversationId: query.conversationId } : {}),
    ...(query.search?.trim()
      ? {
          OR: [
            { title: { contains: query.search.trim(), mode: "insensitive" } },
            { content: { contains: query.search.trim(), mode: "insensitive" } },
          ],
        }
      : {}),
  };

  if (!query.includeArchived) {
    where.NOT = [{ metadata: { path: ["archived"], equals: true } }];
  }

  if (query.pinnedOnly) {
    where.metadata = { path: ["pinned"], equals: true };
  }

  if (query.collectionId) {
    where.references = {
      some: {
        entityType: "COLLECTION",
        entityId: query.collectionId,
      },
    };
  }

  return where;
}

export async function listMemories(
  ownerId: string,
  query: MemoryListQuery = {},
): Promise<MemoryListResult> {
  const validated = validateMemoryListQuery(query);
  const businessId = await getOwnedBusinessId(ownerId);
  const where = buildMemoryWhere(businessId, validated);
  const page = validated.page ?? 1;
  const pageSize = validated.pageSize ?? 20;

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

export async function getMemoryDashboardStats(ownerId: string): Promise<MemoryDashboardStats> {
  const businessId = await getOwnedBusinessId(ownerId);
  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    totalMemories,
    shortTermMemories,
    longTermMemories,
    semanticMemories,
    pinnedMemories,
    archivedMemories,
    expiringSoon,
    totalCollections,
  ] = await Promise.all([
    prisma.aIMemory.count({ where: { businessId } }),
    prisma.aIMemory.count({ where: { businessId, memoryType: "SHORT_TERM" } }),
    prisma.aIMemory.count({ where: { businessId, memoryType: "LONG_TERM" } }),
    prisma.aIMemory.count({ where: { businessId, memoryType: "SEMANTIC" } }),
    prisma.aIMemory.count({
      where: { businessId, metadata: { path: ["pinned"], equals: true } },
    }),
    prisma.aIMemory.count({
      where: { businessId, metadata: { path: ["archived"], equals: true } },
    }),
    prisma.aIMemory.count({
      where: { businessId, expiresAt: { lte: soon, gte: now } },
    }),
    prisma.aIMemoryCollection.count({ where: { businessId } }),
  ]);

  return {
    totalMemories,
    shortTermMemories,
    longTermMemories,
    semanticMemories,
    pinnedMemories,
    archivedMemories,
    expiringSoon,
    totalCollections,
  };
}

export async function listMemoryTimeline(
  ownerId: string,
  limit = 50,
): Promise<MemoryTimelineEntry[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  const items = await prisma.aIMemory.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      memoryType: true,
      importanceScore: true,
      createdAt: true,
      agentId: true,
    },
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    memoryType: item.memoryType,
    importanceScore: item.importanceScore,
    createdAt: item.createdAt.toISOString(),
    agentId: item.agentId,
  }));
}

export async function mergeMemories(
  ownerId: string,
  input: MemoryMergeInput,
  staffId?: string | null,
): Promise<MemoryRecord> {
  if (input.sourceMemoryIds.length < 2) {
    throw new Error("At least two memories are required to merge");
  }

  const sources = await Promise.all(
    input.sourceMemoryIds.map((memoryId) => getMemory(ownerId, memoryId)),
  );

  const mergedContent = sources
    .map((memory) => `# ${memory.title}\n${memory.content}`)
    .join("\n\n");
  const mergedMetadata = {
    mergedFrom: input.sourceMemoryIds,
    mergedAt: new Date().toISOString(),
  };

  const created = await createMemory(
    ownerId,
    {
      title: input.targetTitle.trim(),
      content: mergedContent,
      memoryType: input.targetMemoryType ?? sources[0]?.memoryType ?? "LONG_TERM",
      importanceScore: Math.max(...sources.map((memory) => memory.importanceScore)),
      metadata: mergedMetadata,
      agentId: sources.find((memory) => memory.agentId)?.agentId,
      staffId: sources.find((memory) => memory.staffId)?.staffId,
      customerId: sources.find((memory) => memory.customerId)?.customerId,
      conversationId: sources.find((memory) => memory.conversationId)?.conversationId,
    },
    staffId,
  );

  await Promise.all(
    input.sourceMemoryIds.map((memoryId) => deleteMemory(ownerId, memoryId, staffId)),
  );
  return created;
}

export async function listMemoryCollections(ownerId: string): Promise<MemoryCollectionRecord[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  const collections = await prisma.aIMemoryCollection.findMany({
    where: { businessId },
    orderBy: { updatedAt: "desc" },
  });

  const counts = await Promise.all(
    collections.map((collection) =>
      prisma.aIMemoryReference.count({
        where: {
          entityType: "COLLECTION",
          entityId: collection.id,
        },
      }),
    ),
  );

  return collections.map((collection, index) =>
    serializeMemoryCollection(collection, counts[index] ?? 0),
  );
}

export async function createMemoryCollection(
  ownerId: string,
  input: MemoryCollectionInput,
): Promise<MemoryCollectionRecord> {
  validateCollectionInput(input);
  const businessId = await getOwnedBusinessId(ownerId);

  const collection = await prisma.aIMemoryCollection.create({
    data: {
      businessId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
    },
  });

  return serializeMemoryCollection(collection, 0);
}

export async function deleteMemoryCollection(ownerId: string, collectionId: string): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const collection = await prisma.aIMemoryCollection.findFirst({
    where: { id: collectionId, businessId },
  });
  if (!collection) throw new Error("Collection not found");

  await prisma.aIMemoryReference.deleteMany({
    where: { entityType: "COLLECTION", entityId: collectionId },
  });
  await prisma.aIMemoryCollection.delete({ where: { id: collectionId } });
}

export async function assignMemoryToCollection(
  ownerId: string,
  memoryId: string,
  collectionId: string,
): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const [memory, collection] = await Promise.all([
    prisma.aIMemory.findFirst({ where: { id: memoryId, businessId } }),
    prisma.aIMemoryCollection.findFirst({ where: { id: collectionId, businessId } }),
  ]);

  if (!memory) throw new Error("Memory not found");
  if (!collection) throw new Error("Collection not found");

  const existing = await prisma.aIMemoryReference.findFirst({
    where: {
      memoryId,
      entityType: "COLLECTION",
      entityId: collectionId,
    },
  });

  if (!existing) {
    await prisma.aIMemoryReference.create({
      data: {
        memoryId,
        entityType: "COLLECTION",
        entityId: collectionId,
        relationship: "member",
      },
    });
  }
}
