import { MEMORY_TYPES } from "@/modules/ai/constants/memory-types";
import type { AiMemoryEntry, AiMemoryQuery, AiMemoryWriteInput } from "@/modules/ai/types/memory";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function matchesQuery(entry: AiMemoryEntry, query: AiMemoryQuery): boolean {
  if (query.type && entry.type !== query.type) return false;
  if (query.tenantId && entry.tenantId !== query.tenantId) return false;
  if (query.workspaceId && entry.workspaceId !== query.workspaceId) return false;
  if (query.businessId && entry.businessId !== query.businessId) return false;
  if (query.userId && entry.userId !== query.userId) return false;
  if (query.agentSlug && entry.agentSlug !== query.agentSlug) return false;
  if (query.conversationId && entry.conversationId !== query.conversationId) return false;
  if (query.key && entry.key !== query.key) return false;
  return true;
}

/** In-memory mock store for all memory types. */
export class MemoryEngine {
  private readonly store = new Map<string, AiMemoryEntry>();

  write(input: AiMemoryWriteInput): AiMemoryEntry {
    const existing = this.findOne({ ...input, type: input.type, key: input.key });

    if (existing) {
      const updated: AiMemoryEntry = {
        ...existing,
        value: input.value,
        metadata: input.metadata ?? existing.metadata,
        updatedAt: new Date().toISOString(),
      };
      this.store.set(existing.id, updated);
      return updated;
    }

    const entry: AiMemoryEntry = {
      id: createId("mem"),
      type: input.type,
      key: input.key,
      value: input.value,
      metadata: input.metadata,
      tenantId: input.tenantId ?? null,
      workspaceId: input.workspaceId ?? null,
      businessId: input.businessId ?? null,
      userId: input.userId ?? null,
      agentSlug: input.agentSlug ?? null,
      conversationId: input.conversationId ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.store.set(entry.id, entry);
    return entry;
  }

  read(query: AiMemoryQuery = {}): AiMemoryEntry[] {
    const results = Array.from(this.store.values()).filter((entry) => matchesQuery(entry, query));
    const limit = query.limit ?? results.length;
    return results.slice(0, limit);
  }

  findOne(query: AiMemoryQuery): AiMemoryEntry | undefined {
    return this.read({ ...query, limit: 1 })[0];
  }

  delete(id: string): boolean {
    return this.store.delete(id);
  }

  summarize(query: AiMemoryQuery = {}): string {
    const entries = this.read({ ...query, limit: 10 });

    if (entries.length === 0) {
      return "No relevant memory available.";
    }

    return entries.map((entry) => `[${entry.type}] ${entry.key}: ${entry.value}`).join("\n");
  }

  writeConversationMemory(
    conversationId: string,
    key: string,
    value: string,
    scope: Omit<AiMemoryWriteInput, "type" | "key" | "value" | "conversationId">,
  ): AiMemoryEntry {
    return this.write({
      type: MEMORY_TYPES.CONVERSATION,
      key,
      value,
      conversationId,
      ...scope,
    });
  }

  writeBusinessContext(
    businessId: string,
    key: string,
    value: string,
    scope: Omit<AiMemoryWriteInput, "type" | "key" | "value" | "businessId">,
  ): AiMemoryEntry {
    return this.write({
      type: MEMORY_TYPES.BUSINESS_CONTEXT,
      key,
      value,
      businessId,
      ...scope,
    });
  }

  writeWorkspaceMemory(
    workspaceId: string,
    key: string,
    value: string,
    scope: Omit<AiMemoryWriteInput, "type" | "key" | "value" | "workspaceId">,
  ): AiMemoryEntry {
    return this.write({
      type: MEMORY_TYPES.WORKSPACE,
      key,
      value,
      workspaceId,
      ...scope,
    });
  }

  writeUserMemory(
    userId: string,
    key: string,
    value: string,
    scope: Omit<AiMemoryWriteInput, "type" | "key" | "value" | "userId">,
  ): AiMemoryEntry {
    return this.write({
      type: MEMORY_TYPES.USER,
      key,
      value,
      userId,
      ...scope,
    });
  }

  writeAgentMemory(
    agentSlug: string,
    key: string,
    value: string,
    scope: Omit<AiMemoryWriteInput, "type" | "key" | "value" | "agentSlug">,
  ): AiMemoryEntry {
    return this.write({
      type: MEMORY_TYPES.AGENT,
      key,
      value,
      agentSlug,
      ...scope,
    });
  }
}

export const memoryEngine = new MemoryEngine();
