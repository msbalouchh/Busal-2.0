import type { MemoryType, Prisma } from "@prisma/client";

import type {
  MemoryCollectionInput,
  MemoryCollectionRecord,
  MemoryInput,
  MemoryListQuery,
  MemoryRecord,
  MemoryReferenceRecord,
  MemorySearchQuery,
  MemoryUpdateInput,
} from "@/modules/ai-memory-management/types/ai-memory-types";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

function readMetadataFlag(metadata: Prisma.JsonValue, key: string): boolean {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return false;
  }

  return Boolean((metadata as Record<string, unknown>)[key]);
}

export function serializeMemory(memory: {
  id: string;
  businessId: string;
  agentId: string | null;
  staffId: string | null;
  customerId: string | null;
  conversationId: string | null;
  memoryType: MemoryType;
  title: string;
  content: string;
  embeddingReference: string | null;
  metadata: Prisma.JsonValue;
  importanceScore: number;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { references: number };
}): MemoryRecord {
  return {
    id: memory.id,
    businessId: memory.businessId,
    agentId: memory.agentId,
    staffId: memory.staffId,
    customerId: memory.customerId,
    conversationId: memory.conversationId,
    memoryType: memory.memoryType,
    title: memory.title,
    content: memory.content,
    embeddingReference: memory.embeddingReference,
    metadata:
      memory.metadata && typeof memory.metadata === "object" && !Array.isArray(memory.metadata)
        ? (memory.metadata as Record<string, unknown>)
        : {},
    importanceScore: memory.importanceScore,
    expiresAt: memory.expiresAt?.toISOString() ?? null,
    createdAt: memory.createdAt.toISOString(),
    updatedAt: memory.updatedAt.toISOString(),
    isPinned: readMetadataFlag(memory.metadata, "pinned"),
    isArchived: readMetadataFlag(memory.metadata, "archived"),
    referenceCount: memory._count?.references ?? 0,
  };
}

export function serializeMemoryReference(reference: {
  id: string;
  memoryId: string;
  entityType: string;
  entityId: string;
  relationship: string;
}): MemoryReferenceRecord {
  return {
    id: reference.id,
    memoryId: reference.memoryId,
    entityType: reference.entityType,
    entityId: reference.entityId,
    relationship: reference.relationship,
  };
}

export function serializeMemoryCollection(
  collection: {
    id: string;
    businessId: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
  memoryCount = 0,
): MemoryCollectionRecord {
  return {
    id: collection.id,
    businessId: collection.businessId,
    name: collection.name,
    description: collection.description,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
    memoryCount,
  };
}

export function validateMemoryInput(input: MemoryInput): void {
  if (!input.title?.trim()) throw new Error("Memory title is required");
  if (!input.content?.trim()) throw new Error("Memory content is required");
  if (!input.memoryType) throw new Error("Memory type is required");
}

export function validateMemoryUpdateInput(input: MemoryUpdateInput): void {
  if (input.title !== undefined && !input.title.trim()) {
    throw new Error("Memory title cannot be empty");
  }
  if (input.content !== undefined && !input.content.trim()) {
    throw new Error("Memory content cannot be empty");
  }
}

export function validateMemoryListQuery(query: MemoryListQuery = {}): MemoryListQuery {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE));
  return { ...query, page, pageSize };
}

export function validateMemorySearchQuery(query: MemorySearchQuery = {}): MemorySearchQuery {
  return validateMemoryListQuery(query);
}

export function validateCollectionInput(input: MemoryCollectionInput): void {
  if (!input.name?.trim()) throw new Error("Collection name is required");
}

export function mergeMetadata(
  current: Prisma.JsonValue,
  patch: Record<string, unknown>,
): Prisma.InputJsonValue {
  const base =
    current && typeof current === "object" && !Array.isArray(current)
      ? (current as Record<string, unknown>)
      : {};
  return { ...base, ...patch } as Prisma.InputJsonValue;
}
