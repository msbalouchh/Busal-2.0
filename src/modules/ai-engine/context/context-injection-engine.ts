import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type { AiInjectedContext } from "@/modules/ai-engine/types/ai-engine.types";
import { aiMemoryManager, resolveSubscriptionContext } from "@/modules/ai-engine/managers/memory-manager";
import { buildUnifiedMemoryContext } from "@/modules/customer-ai/services/customer-ai-memory.service";
import { retrieveKnowledge } from "@/services/ai-knowledge.service";

/** Automatically builds full AI context from platform business context. */
export class AiContextInjectionEngine {
  async buildFromPlatform(
    platform: BusinessContext,
    options: {
      currentModule?: string | null;
      query?: string;
      extraData?: Record<string, unknown>;
    } = {},
  ): Promise<AiInjectedContext> {
    const businessId = platform.business.id;
    const subscription = await resolveSubscriptionContext(businessId);

    const [tenantRecord, branch, memorySummary, unifiedMemory, knowledge] = await Promise.all([
      prisma.tenantRecord.findUnique({ where: { businessId } }),
      platform.branchId
        ? prisma.branch.findFirst({ where: { id: platform.branchId, businessId } })
        : Promise.resolve(null),
      aiMemoryManager.summarizeForContext(businessId, platform.user.id),
      buildUnifiedMemoryContext(businessId).catch(() => ""),
      options.query
        ? retrieveKnowledge(platform, options.query, { limit: 3, agentId: "ai-engine" }).catch(() => null)
        : Promise.resolve(null),
    ]);

    const relevantData: Record<string, unknown> = {
      memorySummary,
      unifiedMemory: unifiedMemory || null,
      branch: branch
        ? { id: branch.id, name: branch.name, isMain: branch.isMain, status: branch.status }
        : null,
      ...(options.extraData ?? {}),
    };

    if (knowledge) {
      relevantData.knowledge = {
        context: knowledge.context,
        citations: knowledge.citations.slice(0, 3),
        confidenceScore: knowledge.confidenceScore,
      };
    }

    return {
      tenantId: businessId,
      workspaceId: `${businessId}-ws`,
      businessId,
      branchId: platform.branchId,
      userId: platform.user.id,
      userName: platform.user.fullName,
      userEmail: platform.user.email,
      subscriptionPlan: tenantRecord?.subscriptionPlan ?? subscription.plan,
      subscriptionStatus: tenantRecord?.subscriptionStatus ?? subscription.status,
      enabledModules: subscription.enabledModules,
      permissions: platform.permissions,
      roleSlug: platform.roleSlug ?? null,
      isOwner: platform.isOwner,
      businessName: platform.business.businessName ?? "Business",
      industry: platform.business.industry ?? "restaurant",
      timezone: platform.business.timezone ?? "UTC",
      currency: platform.business.currency ?? "GBP",
      currentModule: options.currentModule ?? null,
      businessProfile: {
        businessType: platform.business.businessType,
        onboardingCompleted: platform.business.onboardingCompleted,
        businessGoal: platform.business.businessGoal,
        aiName: platform.business.aiName,
        aiPersonality: platform.business.aiPersonality,
        aiAvatarUrl: (platform.business as { aiAvatarUrl?: string | null }).aiAvatarUrl ?? null,
        aiGreeting: (platform.business as { aiGreeting?: string | null }).aiGreeting ?? null,
        aiTone: (platform.business as { aiTone?: string | null }).aiTone ?? null,
      },
      relevantData,
    };
  }
}

export const aiContextInjectionEngine = new AiContextInjectionEngine();

export interface AiAuditRecordInput {
  businessId: string;
  userId?: string;
  staffId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  metadata: Record<string, unknown>;
}

/** Persists AI audit trail to AiAgentAuditLog. */
export class AiAuditService {
  async log(input: AiAuditRecordInput): Promise<string> {
    const record = await prisma.aiAgentAuditLog.create({
      data: {
        businessId: input.businessId,
        staffId: input.staffId ?? null,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    });

    return record.id;
  }
}

export const aiAuditService = new AiAuditService();

export function calculateTokenCostCents(input: {
  promptTokens: number;
  completionTokens: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
}): number {
  const inputCost = (input.promptTokens / 1000) * input.inputCostPer1k;
  const outputCost = (input.completionTokens / 1000) * input.outputCostPer1k;
  return Math.round((inputCost + outputCost) * 100);
}
