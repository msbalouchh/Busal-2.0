import { MOCK_AI_MEMORY_ENTRIES } from "@/modules/ai/constants/mock-data";
import { memoryEngine } from "@/modules/ai/memory/memory-engine";

export function seedMockMemory(): void {
  for (const entry of MOCK_AI_MEMORY_ENTRIES) {
    memoryEngine.write({
      type: entry.type,
      key: entry.key,
      value: entry.value,
      metadata: entry.metadata,
      tenantId: entry.tenantId,
      workspaceId: entry.workspaceId,
      businessId: entry.businessId,
      userId: entry.userId,
      agentSlug: entry.agentSlug,
      conversationId: entry.conversationId,
    });
  }
}

seedMockMemory();
