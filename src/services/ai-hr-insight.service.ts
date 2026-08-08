import "server-only";

/** Non-inference service — no parallel AI execution. */

import type { Prisma, HRPriority } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  serializeHrInsight,
  serializeHrRecommendation,
  validateHrInsightListQuery,
  validateHrRecommendationListQuery,
  validateHrRecommendationStatusUpdate,
} from "@/modules/ai-hr-agent-management/lib/ai-hr-agent-validation";
import type {
  HrInsightListQuery,
  HrInsightRecord,
  HrRecommendationListQuery,
  HrRecommendationRecord,
} from "@/modules/ai-hr-agent-management/types/ai-hr-agent-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

const staffInclude = { staff: { select: { id: true, fullName: true } } } as const;

export async function listHrInsights(
  ownerId: string,
  query: HrInsightListQuery = {},
): Promise<{ items: HrInsightRecord[]; total: number; page: number; pageSize: number }> {
  const validated = validateHrInsightListQuery(query);
  const businessId = await getOwnedBusinessId(ownerId);
  const page = validated.page ?? 1;
  const pageSize = validated.pageSize ?? 20;

  const where: Prisma.AIHRInsightWhereInput = {
    businessId,
    ...(validated.priority && validated.priority !== "ALL" ? { priority: validated.priority } : {}),
    ...(validated.category ? { category: validated.category } : {}),
    ...(validated.status && validated.status !== "ALL" ? { status: validated.status } : {}),
    ...(validated.staffId ? { staffId: validated.staffId } : {}),
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
    prisma.aIHRInsight.count({ where }),
    prisma.aIHRInsight.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: staffInclude,
    }),
  ]);

  return { items: items.map(serializeHrInsight), total, page, pageSize };
}

export async function listHrRecommendations(
  ownerId: string,
  query: HrRecommendationListQuery = {},
): Promise<{
  items: HrRecommendationRecord[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const validated = validateHrRecommendationListQuery(query);
  const businessId = await getOwnedBusinessId(ownerId);
  const page = validated.page ?? 1;
  const pageSize = validated.pageSize ?? 20;

  const where: Prisma.AIHRRecommendationWhereInput = {
    businessId,
    ...(validated.status && validated.status !== "ALL" ? { status: validated.status } : {}),
    ...(validated.staffId ? { staffId: validated.staffId } : {}),
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
    prisma.aIHRRecommendation.count({ where }),
    prisma.aIHRRecommendation.findMany({
      where,
      orderBy: [{ confidenceScore: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: staffInclude,
    }),
  ]);

  return { items: items.map(serializeHrRecommendation), total, page, pageSize };
}

export async function createHrInsight(
  businessId: string,
  input: {
    staffId?: string;
    title: string;
    description?: string;
    category?: string;
    priority?: HRPriority;
    recommendation?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<HrInsightRecord> {
  const insight = await prisma.aIHRInsight.create({
    data: {
      businessId,
      staffId: input.staffId,
      title: input.title,
      description: input.description,
      category: input.category ?? "general",
      priority: input.priority ?? "MEDIUM",
      recommendation: input.recommendation,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
    include: staffInclude,
  });

  return serializeHrInsight(insight);
}

export async function createHrRecommendation(
  businessId: string,
  input: {
    staffId?: string;
    title: string;
    description?: string;
    action: string;
    confidenceScore?: number;
    metadata?: Record<string, unknown>;
  },
): Promise<HrRecommendationRecord> {
  const recommendation = await prisma.aIHRRecommendation.create({
    data: {
      businessId,
      staffId: input.staffId,
      title: input.title,
      description: input.description,
      action: input.action,
      confidenceScore: input.confidenceScore,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
    include: staffInclude,
  });

  return serializeHrRecommendation(recommendation);
}

export async function updateHrRecommendationStatus(
  ownerId: string,
  recommendationId: string,
  status: string,
): Promise<HrRecommendationRecord> {
  const validated = validateHrRecommendationStatusUpdate(status);
  const businessId = await getOwnedBusinessId(ownerId);

  const existing = await prisma.aIHRRecommendation.findFirst({
    where: { id: recommendationId, businessId },
  });
  if (!existing) throw new Error("Recommendation not found");

  const updated = await prisma.aIHRRecommendation.update({
    where: { id: recommendationId },
    data: { status: validated },
    include: staffInclude,
  });

  return serializeHrRecommendation(updated);
}

export async function dismissHrInsight(
  ownerId: string,
  insightId: string,
): Promise<HrInsightRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.aIHRInsight.findFirst({
    where: { id: insightId, businessId },
  });
  if (!existing) throw new Error("Insight not found");

  const updated = await prisma.aIHRInsight.update({
    where: { id: insightId },
    data: { status: "DISMISSED" },
    include: staffInclude,
  });

  return serializeHrInsight(updated);
}

export async function searchHrContent(
  ownerId: string,
  search: string,
): Promise<{ insights: HrInsightRecord[]; recommendations: HrRecommendationRecord[] }> {
  const [insights, recommendations] = await Promise.all([
    listHrInsights(ownerId, { search, pageSize: 10 }),
    listHrRecommendations(ownerId, { search, pageSize: 10 }),
  ]);

  return { insights: insights.items, recommendations: recommendations.items };
}
