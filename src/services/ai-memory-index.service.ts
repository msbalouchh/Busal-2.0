import "server-only";

import type { MemoryEmbeddingResult } from "@/modules/ai-memory-management/interfaces/memory-provider.interface";
import { updateMemory } from "@/services/ai-memory.service";

const LOCAL_INDEX_PREFIX = "local-index";

export async function indexMemoryContent(
  ownerId: string,
  memoryId: string,
  content: string,
  metadata?: Record<string, unknown>,
): Promise<MemoryEmbeddingResult> {
  const reference = `${LOCAL_INDEX_PREFIX}:${memoryId}:${Buffer.from(content).toString("base64url").slice(0, 24)}`;

  await updateMemory(ownerId, memoryId, {
    embeddingReference: reference,
    metadata: {
      indexedAt: new Date().toISOString(),
      indexProvider: "local-abstraction",
      ...(metadata ?? {}),
    },
  });

  return {
    reference,
    provider: "local-abstraction",
  };
}

export async function resolveEmbeddingReference(reference: string | null): Promise<string | null> {
  if (!reference) return null;
  return reference;
}

export function buildSemanticSearchInterface(query: string): {
  query: string;
  mode: "keyword-fallback";
  provider: "abstraction-layer";
} {
  return {
    query,
    mode: "keyword-fallback",
    provider: "abstraction-layer",
  };
}
