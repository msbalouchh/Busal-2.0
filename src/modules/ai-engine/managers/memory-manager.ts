import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { commercialLimitsService } from "@/modules/commercial-foundation/services/commercial-limits.service";
import { usageTrackingService } from "@/modules/commercial-foundation/services/usage-tracking.service";
import { PLATFORM_MODULE_KEYS } from "@/modules/feature-access";
import { assertPlatformModuleAccess } from "@/modules/feature-access/guards/platform-feature.guard";
import { featureResolver } from "@/modules/feature-access";

export type AiMemoryScope = "session" | "business" | "user";

function resolveAgentRecordId(businessId: string, agentRecordId?: string): Promise<string> {
  if (agentRecordId && agentRecordId !== businessId) {
    return Promise.resolve(agentRecordId);
  }

  return ensureSystemAgentRecord(businessId);
}

async function ensureSystemAgentRecord(businessId: string): Promise<string> {
  const existing = await prisma.aiAgent.findUnique({
    where: {
      businessId_agentId: {
        businessId,
        agentId: "busal-system",
      },
    },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const created = await prisma.aiAgent.create({
    data: {
      businessId,
      agentId: "busal-system",
      name: "Busal System Agent",
      description: "Internal system agent for AI engine memory",
      status: "PUBLISHED",
    },
    select: { id: true },
  });

  return created.id;
}

/** Tiered memory via AiAgentMemory Prisma records. */
export class AiMemoryManager {
  async write(input: {
    businessId: string;
    scope: AiMemoryScope;
    key: string;
    content: string;
    userId?: string;
    agentRecordId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const memoryKey = this.buildKey(input.scope, input.key, input.userId);
    const agentRecordId = await resolveAgentRecordId(input.businessId, input.agentRecordId);

    const existing = await prisma.aiAgentMemory.findFirst({
      where: { businessId: input.businessId, memoryKey },
    });

    const payload = {
      text: input.content,
      metadata: input.metadata ?? {},
    } as Prisma.InputJsonValue;

    if (existing) {
      await prisma.aiAgentMemory.update({
        where: { id: existing.id },
        data: { content: payload },
      });
      return;
    }

    await prisma.aiAgentMemory.create({
      data: {
        businessId: input.businessId,
        agentRecordId,
        memoryKey,
        memoryType: input.scope === "business" ? "LONG_TERM" : "SHORT_TERM",
        content: payload,
      },
    });
  }

  async read(input: {
    businessId: string;
    scope: AiMemoryScope;
    key: string;
    userId?: string;
  }): Promise<string | null> {
    const memoryKey = this.buildKey(input.scope, input.key, input.userId);
    const record = await prisma.aiAgentMemory.findFirst({
      where: { businessId: input.businessId, memoryKey },
      select: { content: true },
    });

    if (!record?.content || typeof record.content !== "object" || record.content === null) {
      return null;
    }

    const content = record.content as { text?: string };
    return content.text ?? null;
  }

  async summarizeForContext(businessId: string, _userId?: string, limit = 5): Promise<string> {
    const records = await prisma.aiAgentMemory.findMany({
      where: { businessId },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: { memoryKey: true, content: true },
    });

    if (records.length === 0) {
      return "No prior memory available.";
    }

    return records
      .map((record) => {
        const text =
          record.content && typeof record.content === "object" && "text" in record.content
            ? String((record.content as { text?: string }).text ?? "")
            : "";
        return `- ${record.memoryKey ?? "memory"}: ${text.slice(0, 200)}`;
      })
      .join("\n");
  }

  private buildKey(scope: AiMemoryScope, key: string, userId?: string): string {
    if (scope === "user" && userId) {
      return `user:${userId}:${key}`;
    }
    if (scope === "session") {
      return `session:${key}`;
    }
    return `business:${key}`;
  }
}

export const aiMemoryManager = new AiMemoryManager();

/** Enforces commercial AI limits before inference. */
export class AiUsageService {
  async assertAllowed(businessId: string): Promise<void> {
    await assertPlatformModuleAccess(businessId, PLATFORM_MODULE_KEYS.AI);
    await commercialLimitsService.assertWithinLimit(businessId, "ai_requests");
  }

  async recordUsage(input: {
    businessId: string;
    tokens: number;
    userId?: string;
  }): Promise<void> {
    await usageTrackingService.increment({
      businessId: input.businessId,
      metric: "ai_requests",
      amount: 1,
    });

    if (input.tokens > 0) {
      await usageTrackingService.increment({
        businessId: input.businessId,
        metric: "ai_requests",
        amount: Math.max(0, Math.round(input.tokens / 1000)),
      });
    }
  }

  async getUsageSummary(businessId: string): Promise<Record<string, number>> {
    return usageTrackingService.getUsageSummary(businessId);
  }
}

export const aiUsageService = new AiUsageService();

export async function resolveSubscriptionContext(businessId: string): Promise<{
  plan: string;
  status: string;
  enabledModules: string[];
}> {
  const subscription = await featureResolver.resolveForBusiness(businessId);
  return {
    plan: subscription.plan,
    status: subscription.status,
    enabledModules: subscription.enabledModules,
  };
}
