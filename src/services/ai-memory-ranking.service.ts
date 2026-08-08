import "server-only";

/** Non-inference service — no parallel AI execution. */

import type { MemoryType } from "@prisma/client";

import type { MemoryRecord } from "@/modules/ai-memory-management/types/ai-memory-types";

const TYPE_WEIGHTS: Record<MemoryType, number> = {
  SHORT_TERM: 0.2,
  SESSION: 0.25,
  BUSINESS: 0.6,
  CUSTOMER: 0.55,
  STAFF: 0.5,
  KNOWLEDGE: 0.75,
  SEMANTIC: 0.8,
  LONG_TERM: 0.7,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function calculateImportanceScore(input: {
  memoryType: MemoryType;
  contentLength: number;
  referenceCount?: number;
  isPinned?: boolean;
  createdAt?: Date;
}): number {
  const typeWeight = TYPE_WEIGHTS[input.memoryType] ?? 0.5;
  const lengthFactor = Math.min(1, input.contentLength / 1200);
  const referenceFactor = Math.min(0.2, (input.referenceCount ?? 0) * 0.04);
  const pinFactor = input.isPinned ? 0.15 : 0;
  const ageDays = input.createdAt
    ? Math.max(0, (Date.now() - input.createdAt.getTime()) / MS_PER_DAY)
    : 0;
  const recencyFactor = Math.max(0, 0.15 - ageDays * 0.01);

  const score = typeWeight + lengthFactor * 0.2 + referenceFactor + pinFactor + recencyFactor;
  return Math.round(Math.min(1, score) * 1000) / 1000;
}

export function rankMemories(memories: MemoryRecord[]): MemoryRecord[] {
  return [...memories].sort((left, right) => {
    if (right.importanceScore !== left.importanceScore) {
      return right.importanceScore - left.importanceScore;
    }
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

export function compressMemoryContent(content: string, maxLength = 500): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3)}...`;
}
