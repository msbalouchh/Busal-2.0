import "server-only";

import type { Prisma, SalesPriority } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  serializeSalesInsight,
  serializeSalesRecommendation,
  validateInsightListQuery,
  validateRecommendationListQuery,
  validateRecommendationStatusUpdate,
} from "@/modules/ai-sales-agent-management/lib/ai-sales-agent-validation";
import type {
  SalesInsightListQuery,
  SalesInsightRecord,
  SalesRecommendationListQuery,
  SalesRecommendationRecord,
} from "@/modules/ai-sales-agent-management/types/ai-sales-agent-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

async function logSalesAgentAudit(
  businessId: string,
  staffId: string | null,
  entityId: string,
  action: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await prisma.aiAgentAuditLog.create({
    data: {
      businessId,
      staffId,
      entityType: "ai_sales_agent",
      entityId,
      action,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

export async function listSalesInsights(
  ownerId: string,
  query: SalesInsightListQuery = {},
): Promise<{ items: SalesInsightRecord[]; total: number; page: number; pageSize: number }> {
  const validated = validateInsightListQuery(query);
  const businessId = await getOwnedBusinessId(ownerId);
  const page = validated.page ?? 1;
  const pageSize = validated.pageSize ?? 20;

  const where: Prisma.AISalesInsightWhereInput = {
    businessId,
    ...(validated.category && validated.category !== "ALL" ? { category: validated.category } : {}),
    ...(validated.priority && validated.priority !== "ALL" ? { priority: validated.priority } : {}),
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
    prisma.aISalesInsight.count({ where }),
    prisma.aISalesInsight.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { items: items.map(serializeSalesInsight), total, page, pageSize };
}

export async function listSalesRecommendations(
  ownerId: string,
  query: SalesRecommendationListQuery = {},
): Promise<{ items: SalesRecommendationRecord[]; total: number; page: number; pageSize: number }> {
  const validated = validateRecommendationListQuery(query);
  const businessId = await getOwnedBusinessId(ownerId);
  const page = validated.page ?? 1;
  const pageSize = validated.pageSize ?? 20;

  const where: Prisma.AISalesRecommendationWhereInput = {
    businessId,
    ...(validated.status && validated.status !== "ALL" ? { status: validated.status } : {}),
    ...(validated.priority && validated.priority !== "ALL" ? { priority: validated.priority } : {}),
    ...(validated.customerId ? { customerId: validated.customerId } : {}),
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
    prisma.aISalesRecommendation.count({ where }),
    prisma.aISalesRecommendation.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { customer: { select: { id: true, name: true } } },
    }),
  ]);

  return { items: items.map(serializeSalesRecommendation), total, page, pageSize };
}

export async function createSalesInsight(
  businessId: string,
  input: {
    title: string;
    description?: string;
    priority?: SalesPriority;
    category: string;
    recommendation?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<SalesInsightRecord> {
  const insight = await prisma.aISalesInsight.create({
    data: {
      businessId,
      title: input.title,
      description: input.description,
      priority: input.priority ?? "MEDIUM",
      category: input.category,
      recommendation: input.recommendation,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });

  return serializeSalesInsight(insight);
}

export async function createSalesRecommendation(
  businessId: string,
  input: {
    customerId?: string;
    title: string;
    description?: string;
    action: string;
    priority?: SalesPriority;
    expectedImpact?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<SalesRecommendationRecord> {
  const recommendation = await prisma.aISalesRecommendation.create({
    data: {
      businessId,
      customerId: input.customerId,
      title: input.title,
      description: input.description,
      action: input.action,
      priority: input.priority ?? "MEDIUM",
      expectedImpact: input.expectedImpact,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
    include: { customer: { select: { id: true, name: true } } },
  });

  return serializeSalesRecommendation(recommendation);
}

export async function updateRecommendationStatus(
  ownerId: string,
  recommendationId: string,
  status: string,
): Promise<SalesRecommendationRecord> {
  const validated = validateRecommendationStatusUpdate(status);
  const businessId = await getOwnedBusinessId(ownerId);

  const existing = await prisma.aISalesRecommendation.findFirst({
    where: { id: recommendationId, businessId },
  });
  if (!existing) throw new Error("Recommendation not found");

  const updated = await prisma.aISalesRecommendation.update({
    where: { id: recommendationId },
    data: { status: validated },
    include: { customer: { select: { id: true, name: true } } },
  });

  await logSalesAgentAudit(businessId, null, recommendationId, "recommendation.status_updated", {
    status: validated,
  });

  return serializeSalesRecommendation(updated);
}

export async function dismissInsight(
  ownerId: string,
  insightId: string,
): Promise<SalesInsightRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.aISalesInsight.findFirst({
    where: { id: insightId, businessId },
  });
  if (!existing) throw new Error("Insight not found");

  const updated = await prisma.aISalesInsight.update({
    where: { id: insightId },
    data: { status: "DISMISSED" },
  });

  return serializeSalesInsight(updated);
}

export async function searchSalesContent(
  ownerId: string,
  search: string,
): Promise<{ insights: SalesInsightRecord[]; recommendations: SalesRecommendationRecord[] }> {
  const [insights, recommendations] = await Promise.all([
    listSalesInsights(ownerId, { search, pageSize: 10 }),
    listSalesRecommendations(ownerId, { search, pageSize: 10 }),
  ]);

  return { insights: insights.items, recommendations: recommendations.items };
}
