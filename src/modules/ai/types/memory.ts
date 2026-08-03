import type { MemoryType } from "@/modules/ai/constants/memory-types";

export interface AiMemoryEntry {
  id: string;
  type: MemoryType;
  key: string;
  value: string;
  metadata?: Record<string, string>;
  tenantId: string | null;
  workspaceId: string | null;
  businessId: string | null;
  userId: string | null;
  agentSlug: string | null;
  conversationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiMemoryQuery {
  type?: MemoryType;
  tenantId?: string | null;
  workspaceId?: string | null;
  businessId?: string | null;
  userId?: string | null;
  agentSlug?: string | null;
  conversationId?: string | null;
  key?: string;
  limit?: number;
}

export interface AiMemoryWriteInput {
  type: MemoryType;
  key: string;
  value: string;
  metadata?: Record<string, string>;
  tenantId?: string | null;
  workspaceId?: string | null;
  businessId?: string | null;
  userId?: string | null;
  agentSlug?: string | null;
  conversationId?: string | null;
}
