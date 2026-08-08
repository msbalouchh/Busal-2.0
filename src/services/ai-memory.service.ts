import "server-only";

/** Non-inference service — no parallel AI execution. */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  mergeMetadata,
  serializeMemory,
  serializeMemoryReference,
  validateMemoryInput,
  validateMemoryUpdateInput,
} from "@/modules/ai-memory-management/lib/ai-memory-validation";
import type {
  MemoryInput,
  MemoryRecord,
  MemoryReferenceRecord,
  MemoryUpdateInput,
} from "@/modules/ai-memory-management/types/ai-memory-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { calculateImportanceScore } from "@/services/ai-memory-ranking.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

async function logMemoryAudit(
  businessId: string,
  staffId: string | null,
  entityId: string,
  action: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await prisma.aiAgentAuditLog.create({
    data: {
      businessId,
      staffId,
      entityType: "ai_memory",
      entityId,
      action,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

export async function createMemory(
  ownerId: string,
  input: MemoryInput,
  staffId?: string | null,
): Promise<MemoryRecord> {
  validateMemoryInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  const importanceScore =
    input.importanceScore ??
    calculateImportanceScore({
      memoryType: input.memoryType,
      contentLength: input.content.trim().length,
      referenceCount: input.references?.length ?? 0,
    });

  const memory = await prisma.aIMemory.create({
    data: {
      businessId,
      agentId: input.agentId ?? null,
      staffId: input.staffId ?? null,
      customerId: input.customerId ?? null,
      conversationId: input.conversationId ?? null,
      memoryType: input.memoryType,
      title: input.title.trim(),
      content: input.content.trim(),
      embeddingReference: input.embeddingReference ?? null,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      importanceScore,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      references: input.references?.length
        ? {
            create: input.references.map((reference) => ({
              entityType: reference.entityType,
              entityId: reference.entityId,
              relationship: reference.relationship,
            })),
          }
        : undefined,
    },
    include: { _count: { select: { references: true } } },
  });

  await logMemoryAudit(businessId, staffId ?? null, memory.id, "memory.create");
  return serializeMemory(memory);
}

export async function getMemory(ownerId: string, memoryId: string): Promise<MemoryRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const memory = await prisma.aIMemory.findFirst({
    where: { id: memoryId, businessId },
    include: { _count: { select: { references: true } } },
  });
  if (!memory) throw new Error("Memory not found");
  return serializeMemory(memory);
}

export async function updateMemory(
  ownerId: string,
  memoryId: string,
  input: MemoryUpdateInput,
  staffId?: string | null,
): Promise<MemoryRecord> {
  validateMemoryUpdateInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.aIMemory.findFirst({ where: { id: memoryId, businessId } });
  if (!existing) throw new Error("Memory not found");

  const memory = await prisma.aIMemory.update({
    where: { id: memoryId },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.content !== undefined ? { content: input.content.trim() } : {}),
      ...(input.memoryType !== undefined ? { memoryType: input.memoryType } : {}),
      ...(input.importanceScore !== undefined ? { importanceScore: input.importanceScore } : {}),
      ...(input.embeddingReference !== undefined
        ? { embeddingReference: input.embeddingReference }
        : {}),
      ...(input.expiresAt !== undefined
        ? { expiresAt: input.expiresAt ? new Date(input.expiresAt) : null }
        : {}),
      ...(input.metadata !== undefined
        ? { metadata: mergeMetadata(existing.metadata, input.metadata) }
        : {}),
    },
    include: { _count: { select: { references: true } } },
  });

  await logMemoryAudit(businessId, staffId ?? null, memory.id, "memory.update");
  return serializeMemory(memory);
}

export async function deleteMemory(
  ownerId: string,
  memoryId: string,
  staffId?: string | null,
): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.aIMemory.findFirst({ where: { id: memoryId, businessId } });
  if (!existing) throw new Error("Memory not found");

  await prisma.aIMemory.delete({ where: { id: memoryId } });
  await logMemoryAudit(businessId, staffId ?? null, memoryId, "memory.delete");
}

export async function pinMemory(
  ownerId: string,
  memoryId: string,
  pinned = true,
  staffId?: string | null,
): Promise<MemoryRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.aIMemory.findFirst({ where: { id: memoryId, businessId } });
  if (!existing) throw new Error("Memory not found");

  const memory = await prisma.aIMemory.update({
    where: { id: memoryId },
    data: { metadata: mergeMetadata(existing.metadata, { pinned }) },
    include: { _count: { select: { references: true } } },
  });

  await logMemoryAudit(
    businessId,
    staffId ?? null,
    memoryId,
    pinned ? "memory.pin" : "memory.unpin",
  );
  return serializeMemory(memory);
}

export async function archiveMemory(
  ownerId: string,
  memoryId: string,
  archived = true,
  staffId?: string | null,
): Promise<MemoryRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.aIMemory.findFirst({ where: { id: memoryId, businessId } });
  if (!existing) throw new Error("Memory not found");

  const memory = await prisma.aIMemory.update({
    where: { id: memoryId },
    data: { metadata: mergeMetadata(existing.metadata, { archived }) },
    include: { _count: { select: { references: true } } },
  });

  await logMemoryAudit(
    businessId,
    staffId ?? null,
    memoryId,
    archived ? "memory.archive" : "memory.restore",
  );
  return serializeMemory(memory);
}

export async function listMemoryReferences(
  ownerId: string,
  memoryId: string,
): Promise<MemoryReferenceRecord[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  const memory = await prisma.aIMemory.findFirst({ where: { id: memoryId, businessId } });
  if (!memory) throw new Error("Memory not found");

  const references = await prisma.aIMemoryReference.findMany({
    where: { memoryId },
    orderBy: { entityType: "asc" },
  });

  return references.map(serializeMemoryReference);
}

export async function addMemoryReference(
  ownerId: string,
  memoryId: string,
  entityType: string,
  entityId: string,
  relationship: string,
): Promise<MemoryReferenceRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const memory = await prisma.aIMemory.findFirst({ where: { id: memoryId, businessId } });
  if (!memory) throw new Error("Memory not found");

  const reference = await prisma.aIMemoryReference.create({
    data: { memoryId, entityType, entityId, relationship },
  });

  return serializeMemoryReference(reference);
}
