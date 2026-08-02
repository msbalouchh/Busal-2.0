import type {
  MemoryContextBundle,
  MemoryInput,
  MemoryRecord,
} from "@/modules/ai-memory-management/types/ai-memory-types";

export interface MemoryEngineDependencies {
  saveMemory: (ownerId: string, input: MemoryInput) => Promise<MemoryRecord>;
  retrieveMemory: (ownerId: string, memoryId: string) => Promise<MemoryRecord>;
  buildContext: (
    ownerId: string,
    scope: {
      agentId?: string;
      staffId?: string;
      customerId?: string;
      conversationId?: string;
    },
  ) => Promise<MemoryContextBundle>;
}

export class MemoryEngine {
  constructor(private readonly deps: MemoryEngineDependencies) {}

  async persist(ownerId: string, input: MemoryInput): Promise<MemoryRecord> {
    return this.deps.saveMemory(ownerId, input);
  }

  async recall(ownerId: string, memoryId: string): Promise<MemoryRecord> {
    return this.deps.retrieveMemory(ownerId, memoryId);
  }

  async buildAgentContext(
    ownerId: string,
    scope: {
      agentId?: string;
      staffId?: string;
      customerId?: string;
      conversationId?: string;
    },
  ): Promise<MemoryContextBundle> {
    return this.deps.buildContext(ownerId, scope);
  }
}
