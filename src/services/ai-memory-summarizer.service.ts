import "server-only";

/** Non-inference service — no parallel AI execution. */

import type { MemoryRecord } from "@/modules/ai-memory-management/types/ai-memory-types";
import { compressMemoryContent } from "@/services/ai-memory-ranking.service";

export function summarizeMemoryRecord(memory: MemoryRecord, maxLength = 240): string {
  return compressMemoryContent(`${memory.title}. ${memory.content}`, maxLength);
}

export function summarizeMemoryCollection(memories: MemoryRecord[], maxItems = 5): string {
  const ranked = [...memories]
    .sort((left, right) => right.importanceScore - left.importanceScore)
    .slice(0, maxItems);

  if (ranked.length === 0) {
    return "No memories available for summarization.";
  }

  return ranked
    .map((memory, index) => `${index + 1}. ${summarizeMemoryRecord(memory, 160)}`)
    .join("\n");
}

export function summarizeConversationContext(memories: MemoryRecord[]): string {
  const working = memories.filter((memory) =>
    ["SHORT_TERM", "SESSION"].includes(memory.memoryType),
  );
  const longTerm = memories.filter((memory) =>
    ["LONG_TERM", "KNOWLEDGE", "SEMANTIC"].includes(memory.memoryType),
  );

  const sections = [
    working.length ? `Working memory:\n${summarizeMemoryCollection(working, 4)}` : null,
    longTerm.length ? `Long-term memory:\n${summarizeMemoryCollection(longTerm, 4)}` : null,
  ].filter(Boolean);

  return sections.join("\n\n") || "No conversation memory context available.";
}
