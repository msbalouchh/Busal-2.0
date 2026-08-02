import type { MemoryType } from "@prisma/client";

export interface MemoryRecord {
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
  metadata: Record<string, unknown>;
  importanceScore: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  isArchived: boolean;
  referenceCount: number;
}

export interface MemoryReferenceRecord {
  id: string;
  memoryId: string;
  entityType: string;
  entityId: string;
  relationship: string;
}

export interface MemoryCollectionRecord {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  memoryCount: number;
}

export interface MemoryInput {
  memoryType: MemoryType;
  title: string;
  content: string;
  agentId?: string | null;
  staffId?: string | null;
  customerId?: string | null;
  conversationId?: string | null;
  embeddingReference?: string | null;
  metadata?: Record<string, unknown>;
  importanceScore?: number;
  expiresAt?: string | null;
  references?: MemoryReferenceInput[];
}

export interface MemoryReferenceInput {
  entityType: string;
  entityId: string;
  relationship: string;
}

export interface MemoryUpdateInput {
  title?: string;
  content?: string;
  memoryType?: MemoryType;
  metadata?: Record<string, unknown>;
  importanceScore?: number;
  expiresAt?: string | null;
  embeddingReference?: string | null;
}

export interface MemoryListQuery {
  search?: string;
  memoryType?: MemoryType | "ALL";
  agentId?: string;
  staffId?: string;
  customerId?: string;
  conversationId?: string;
  collectionId?: string;
  includeArchived?: boolean;
  pinnedOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface MemoryListResult {
  items: MemoryRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MemorySearchQuery extends MemoryListQuery {
  entityType?: string;
  entityId?: string;
  semanticQuery?: string;
  contextScope?: "business" | "customer" | "staff" | "conversation" | "agent";
}

export interface MemoryDashboardStats {
  totalMemories: number;
  shortTermMemories: number;
  longTermMemories: number;
  semanticMemories: number;
  pinnedMemories: number;
  archivedMemories: number;
  expiringSoon: number;
  totalCollections: number;
}

export interface MemoryTimelineEntry {
  id: string;
  title: string;
  memoryType: MemoryType;
  importanceScore: number;
  createdAt: string;
  agentId: string | null;
}

export interface MemoryAnalyticsSnapshot {
  byType: Record<string, number>;
  byAgent: Array<{ agentId: string; count: number }>;
  averageImportance: number;
  retentionDays: number;
  recentGrowth: number;
}

export interface MemoryContextBundle {
  business: MemoryRecord[];
  staff: MemoryRecord[];
  customer: MemoryRecord[];
  conversation: MemoryRecord[];
  session: MemoryRecord[];
  semantic: MemoryRecord[];
  working: MemoryRecord[];
  agent?: MemoryRecord[];
}

export interface MemoryCollectionInput {
  name: string;
  description?: string | null;
}

export interface MemoryMergeInput {
  sourceMemoryIds: string[];
  targetTitle: string;
  targetMemoryType?: MemoryType;
}
