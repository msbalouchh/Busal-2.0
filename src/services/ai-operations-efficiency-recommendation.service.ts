import "server-only";

import type { Prisma, OperationPriority } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  serializeOperationInsight,
  serializeOperationRecommendation,
  validateOperationInsightListQuery,
  validateOperationRecommendationListQuery,
  validateOperationRecommendationStatusUpdate,
} from "@/modules/ai-operations-agent-management/lib/ai-operations-agent-validation";
import type {
  OperationInsightListQuery,
  OperationInsightRecord,
  OperationRecommendationListQuery,
  OperationRecommendationRecord,
} from "@/modules/ai-operations-agent-management/types/ai-operations-agent-types";
import { getOwnedBusinessId } from "@/services/ai-operations-context.service";

export async function listOperationInsights(
  ownerId: string,
  query: OperationInsightListQuery = {},
): Promise<{ items: OperationInsightRecord[]; total: number; page: number; pageSize: number }> {
  const validated = validateOperationInsightListQuery(query);
  const businessId = await getOwnedBusinessId(ownerId);
  const page = validated.page ?? 1;
  const pageSize = validated.pageSize ?? 20;

  const where: Prisma.AIOperationInsightWhereInput = {
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
    prisma.aIOperationInsight.count({ where }),
    prisma.aIOperationInsight.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { items: items.map(serializeOperationInsight), total, page, pageSize };
}

export async function listOperationRecommendations(
  ownerId: string,
  query: OperationRecommendationListQuery = {},
): Promise<{
  items: OperationRecommendationRecord[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const validated = validateOperationRecommendationListQuery(query);
  const businessId = await getOwnedBusinessId(ownerId);
  const page = validated.page ?? 1;
  const pageSize = validated.pageSize ?? 20;

  const where: Prisma.AIOperationRecommendationWhereInput = {
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
    prisma.aIOperationRecommendation.count({ where }),
    prisma.aIOperationRecommendation.findMany({
      where,
      orderBy: [{ confidenceScore: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { items: items.map(serializeOperationRecommendation), total, page, pageSize };
}

export async function createOperationInsight(
  businessId: string,
  input: {
    title: string;
    description?: string;
    category?: string;
    priority?: OperationPriority;
    recommendation?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<OperationInsightRecord> {
  const insight = await prisma.aIOperationInsight.create({
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

  return serializeOperationInsight(insight);
}

export async function createOperationRecommendation(
  businessId: string,
  input: {
    title: string;
    description?: string;
    action: string;
    expectedImpact?: string;
    confidenceScore?: number;
    metadata?: Record<string, unknown>;
  },
): Promise<OperationRecommendationRecord> {
  const recommendation = await prisma.aIOperationRecommendation.create({
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

  return serializeOperationRecommendation(recommendation);
}

export async function updateOperationRecommendationStatus(
  ownerId: string,
  recommendationId: string,
  status: string,
): Promise<OperationRecommendationRecord> {
  const validated = validateOperationRecommendationStatusUpdate(status);
  const businessId = await getOwnedBusinessId(ownerId);

  const existing = await prisma.aIOperationRecommendation.findFirst({
    where: { id: recommendationId, businessId },
  });
  if (!existing) throw new Error("Recommendation not found");

  const updated = await prisma.aIOperationRecommendation.update({
    where: { id: recommendationId },
    data: { status: validated },
  });

  return serializeOperationRecommendation(updated);
}

export async function dismissOperationInsight(
  ownerId: string,
  insightId: string,
): Promise<OperationInsightRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.aIOperationInsight.findFirst({
    where: { id: insightId, businessId },
  });
  if (!existing) throw new Error("Insight not found");

  const updated = await prisma.aIOperationInsight.update({
    where: { id: insightId },
    data: { status: "DISMISSED" },
  });

  return serializeOperationInsight(updated);
}

export async function searchOperationContent(
  ownerId: string,
  search: string,
): Promise<{
  insights: OperationInsightRecord[];
  recommendations: OperationRecommendationRecord[];
}> {
  const [insights, recommendations] = await Promise.all([
    listOperationInsights(ownerId, { search, pageSize: 10 }),
    listOperationRecommendations(ownerId, { search, pageSize: 10 }),
  ]);

  return { insights: insights.items, recommendations: recommendations.items };
}
