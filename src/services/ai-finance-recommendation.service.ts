import "server-only";

/** Non-inference service — no parallel AI execution. */

import type { Prisma, FinancePriority } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  serializeFinanceInsight,
  serializeFinanceRecommendation,
  validateFinanceInsightListQuery,
  validateFinanceRecommendationListQuery,
  validateFinanceRecommendationStatusUpdate,
} from "@/modules/ai-finance-agent-management/lib/ai-finance-agent-validation";
import type {
  FinanceInsightListQuery,
  FinanceInsightRecord,
  FinanceRecommendationListQuery,
  FinanceRecommendationRecord,
} from "@/modules/ai-finance-agent-management/types/ai-finance-agent-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export async function listFinanceInsights(
  ownerId: string,
  query: FinanceInsightListQuery = {},
): Promise<{ items: FinanceInsightRecord[]; total: number; page: number; pageSize: number }> {
  const validated = validateFinanceInsightListQuery(query);
  const businessId = await getOwnedBusinessId(ownerId);
  const page = validated.page ?? 1;
  const pageSize = validated.pageSize ?? 20;

  const where: Prisma.AIFinanceInsightWhereInput = {
    businessId,
    ...(validated.priority && validated.priority !== "ALL" ? { priority: validated.priority } : {}),
    ...(validated.category ? { category: validated.category } : {}),
    ...(validated.status && validated.status !== "ALL" ? { status: validated.status } : {}),
    ...(validated.search?.trim()
      ? {
          OR: [
            { title: { contains: validated.search.trim(), mode: "insensitive" } },
            { description: { contains: validated.search.trim(), mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.aIFinanceInsight.count({ where }),
    prisma.aIFinanceInsight.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { items: items.map(serializeFinanceInsight), total, page, pageSize };
}

export async function listFinanceRecommendations(
  ownerId: string,
  query: FinanceRecommendationListQuery = {},
): Promise<{
  items: FinanceRecommendationRecord[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const validated = validateFinanceRecommendationListQuery(query);
  const businessId = await getOwnedBusinessId(ownerId);
  const page = validated.page ?? 1;
  const pageSize = validated.pageSize ?? 20;

  const where: Prisma.AIFinanceRecommendationWhereInput = {
    businessId,
    ...(validated.status && validated.status !== "ALL" ? { status: validated.status } : {}),
    ...(validated.search?.trim()
      ? {
          OR: [
            { title: { contains: validated.search.trim(), mode: "insensitive" } },
            { description: { contains: validated.search.trim(), mode: "insensitive" } },
            { action: { contains: validated.search.trim(), mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.aIFinanceRecommendation.count({ where }),
    prisma.aIFinanceRecommendation.findMany({
      where,
      orderBy: [{ confidenceScore: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { items: items.map(serializeFinanceRecommendation), total, page, pageSize };
}

export async function createFinanceInsight(
  businessId: string,
  input: {
    title: string;
    description?: string;
    category?: string;
    priority?: FinancePriority;
    recommendation?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<FinanceInsightRecord> {
  const insight = await prisma.aIFinanceInsight.create({
    data: {
      businessId,
      title: input.title,
      description: input.description,
      category: input.category ?? "general",
      priority: input.priority ?? "MEDIUM",
      recommendation: input.recommendation,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });

  return serializeFinanceInsight(insight);
}

export async function createFinanceRecommendation(
  businessId: string,
  input: {
    title: string;
    description?: string;
    action: string;
    expectedImpact?: string;
    confidenceScore?: number;
    metadata?: Record<string, unknown>;
  },
): Promise<FinanceRecommendationRecord> {
  const recommendation = await prisma.aIFinanceRecommendation.create({
    data: {
      businessId,
      title: input.title,
      description: input.description,
      action: input.action,
      expectedImpact: input.expectedImpact,
      confidenceScore: input.confidenceScore,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });

  return serializeFinanceRecommendation(recommendation);
}

export async function updateFinanceRecommendationStatus(
  ownerId: string,
  recommendationId: string,
  status: string,
): Promise<FinanceRecommendationRecord> {
  const validated = validateFinanceRecommendationStatusUpdate(status);
  const businessId = await getOwnedBusinessId(ownerId);

  const existing = await prisma.aIFinanceRecommendation.findFirst({
    where: { id: recommendationId, businessId },
  });
  if (!existing) throw new Error("Recommendation not found");

  const updated = await prisma.aIFinanceRecommendation.update({
    where: { id: recommendationId },
    data: { status: validated },
  });

  return serializeFinanceRecommendation(updated);
}

export async function dismissFinanceInsight(
  ownerId: string,
  insightId: string,
): Promise<FinanceInsightRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.aIFinanceInsight.findFirst({
    where: { id: insightId, businessId },
  });
  if (!existing) throw new Error("Insight not found");

  const updated = await prisma.aIFinanceInsight.update({
    where: { id: insightId },
    data: { status: "DISMISSED" },
  });

  return serializeFinanceInsight(updated);
}

export async function searchFinanceContent(
  ownerId: string,
  search: string,
): Promise<{ insights: FinanceInsightRecord[]; recommendations: FinanceRecommendationRecord[] }> {
  const [insights, recommendations] = await Promise.all([
    listFinanceInsights(ownerId, { search, pageSize: 10 }),
    listFinanceRecommendations(ownerId, { search, pageSize: 10 }),
  ]);

  return { insights: insights.items, recommendations: recommendations.items };
}
