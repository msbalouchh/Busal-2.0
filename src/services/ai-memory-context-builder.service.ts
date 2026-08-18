import "server-only";

/** Non-inference service — no parallel AI execution. */

import type { MemoryContextBundle } from "@/modules/ai-memory-management/types/ai-memory-types";
import {
  retrieveAgentMemories,
  retrieveMemoriesByBusinessId,
  retrieveMemoriesByType,
  retrieveWorkingMemories,
  retrieveWorkingMemoriesByBusinessId,
} from "@/services/ai-memory-retrieval.service";
import {
  summarizeConversationContext,
  summarizeMemoryCollection,
} from "@/services/ai-memory-summarizer.service";

export async function buildMemoryContextBundle(
  ownerId: string,
  scope: {
    agentId?: string;
    staffId?: string;
    customerId?: string;
    conversationId?: string;
  },
): Promise<MemoryContextBundle> {
  const [business, staff, customer, session, semantic, working, agentScoped] = await Promise.all([
    retrieveMemoriesByType(ownerId, "BUSINESS", 12),
    scope.staffId ? retrieveMemoriesByType(ownerId, "STAFF", 12) : Promise.resolve([]),
    scope.customerId ? retrieveMemoriesByType(ownerId, "CUSTOMER", 12) : Promise.resolve([]),
    scope.conversationId
      ? retrieveWorkingMemories(ownerId, scope.conversationId, 12)
      : Promise.resolve([]),
    retrieveMemoriesByType(ownerId, "SEMANTIC", 12),
    scope.conversationId
      ? retrieveWorkingMemories(ownerId, scope.conversationId, 8)
      : Promise.resolve([]),
    scope.agentId ? retrieveAgentMemories(ownerId, scope.agentId, 12) : Promise.resolve([]),
  ]);

  return {
    business,
    staff,
    customer,
    conversation: session,
    session,
    semantic,
    working,
    agent: agentScoped,
  };
}

export async function buildConversationContext(
  ownerId: string,
  conversationId: string,
): Promise<string> {
  const working = await retrieveWorkingMemories(ownerId, conversationId, 16);
  const longTerm = await retrieveMemoriesByType(ownerId, "LONG_TERM", 8);
  return summarizeConversationContext([...working, ...longTerm]);
}

export async function buildBusinessContextByBusinessId(businessId: string): Promise<string> {
  const business = await retrieveMemoriesByBusinessId(businessId, "BUSINESS", 10);
  return summarizeMemoryCollection(business, 8);
}

export async function buildConversationContextByBusinessId(
  businessId: string,
  conversationId: string,
): Promise<string> {
  const working = await retrieveWorkingMemoriesByBusinessId(businessId, conversationId, 16);
  const longTerm = await retrieveMemoriesByBusinessId(businessId, "LONG_TERM", 8);
  return summarizeConversationContext([...working, ...longTerm]);
}

export async function buildBusinessContext(ownerId: string): Promise<string> {
  const business = await retrieveMemoriesByType(ownerId, "BUSINESS", 10);
  return summarizeMemoryCollection(business, 8);
}

export async function buildCustomerContext(ownerId: string, customerId: string): Promise<string> {
  const customerMemories = await retrieveMemoriesByType(ownerId, "CUSTOMER", 10);
  const scoped = customerMemories.filter((memory) => memory.customerId === customerId);
  return summarizeMemoryCollection(scoped, 8);
}

export async function buildStaffContext(ownerId: string, staffId: string): Promise<string> {
  const staffMemories = await retrieveMemoriesByType(ownerId, "STAFF", 10);
  const scoped = staffMemories.filter((memory) => memory.staffId === staffId);
  return summarizeMemoryCollection(scoped, 8);
}

export async function getMemoryAnalyticsSnapshot(ownerId: string) {
  const { getMemoryDashboardStats, listMemoryTimeline } =
    await import("@/services/ai-memory-manager.service");
  const { listMemories } = await import("@/services/ai-memory-manager.service");

  const [stats, timeline, recent] = await Promise.all([
    getMemoryDashboardStats(ownerId),
    listMemoryTimeline(ownerId, 30),
    listMemories(ownerId, { pageSize: 100 }),
  ]);

  const byType = recent.items.reduce<Record<string, number>>((accumulator, memory) => {
    accumulator[memory.memoryType] = (accumulator[memory.memoryType] ?? 0) + 1;
    return accumulator;
  }, {});

  const byAgentMap = recent.items.reduce<Map<string, number>>((accumulator, memory) => {
    if (!memory.agentId) return accumulator;
    accumulator.set(memory.agentId, (accumulator.get(memory.agentId) ?? 0) + 1);
    return accumulator;
  }, new Map());

  const averageImportance =
    recent.items.length === 0
      ? 0
      : recent.items.reduce((sum, memory) => sum + memory.importanceScore, 0) / recent.items.length;

  return {
    stats,
    timeline,
    byType,
    byAgent: Array.from(byAgentMap.entries()).map(([agentId, count]) => ({ agentId, count })),
    averageImportance,
    retentionDays: 30,
    recentGrowth: timeline.length,
  };
}
