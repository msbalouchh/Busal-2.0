import "server-only";

/** Non-inference service — no parallel AI execution. */

import { prisma } from "@/lib/prisma";
import { compressMemoryContent } from "@/services/ai-memory-ranking.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export async function cleanupExpiredMemories(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const result = await prisma.aIMemory.deleteMany({
    where: {
      businessId,
      expiresAt: { lte: new Date() },
    },
  });
  return result.count;
}

export async function archiveExpiredShortTermMemories(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const cutoff = new Date(Date.now() - 7 * MS_PER_DAY);
  const candidates = await prisma.aIMemory.findMany({
    where: {
      businessId,
      memoryType: { in: ["SHORT_TERM", "SESSION"] },
      updatedAt: { lte: cutoff },
      NOT: [{ metadata: { path: ["archived"], equals: true } }],
    },
    select: { id: true, metadata: true },
  });

  await Promise.all(
    candidates.map((memory) =>
      prisma.aIMemory.update({
        where: { id: memory.id },
        data: {
          metadata: {
            ...(typeof memory.metadata === "object" && !Array.isArray(memory.metadata)
              ? (memory.metadata as Record<string, unknown>)
              : {}),
            archived: true,
            archivedAt: new Date().toISOString(),
          },
        },
      }),
    ),
  );

  return candidates.length;
}

export async function compressLongTermMemories(ownerId: string, limit = 25): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const memories = await prisma.aIMemory.findMany({
    where: {
      businessId,
      memoryType: { in: ["LONG_TERM", "KNOWLEDGE", "SEMANTIC"] },
      NOT: [{ metadata: { path: ["compressed"], equals: true } }],
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });

  await Promise.all(
    memories.map((memory) =>
      prisma.aIMemory.update({
        where: { id: memory.id },
        data: {
          content: compressMemoryContent(memory.content, 800),
          metadata: {
            ...(typeof memory.metadata === "object" && !Array.isArray(memory.metadata)
              ? (memory.metadata as Record<string, unknown>)
              : {}),
            compressed: true,
            compressedAt: new Date().toISOString(),
          },
        },
      }),
    ),
  );

  return memories.length;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function runMemoryRetentionJob(ownerId: string): Promise<{
  deleted: number;
  archived: number;
  compressed: number;
}> {
  const [deleted, archived, compressed] = await Promise.all([
    cleanupExpiredMemories(ownerId),
    archiveExpiredShortTermMemories(ownerId),
    compressLongTermMemories(ownerId),
  ]);

  return { deleted, archived, compressed };
}
