import "server-only";

import type { Prisma, SupportPriority } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  serializeSupportInsight,
  serializeSupportRecommendation,
  validateSupportInsightListQuery,
  validateSupportRecommendationListQuery,
  validateSupportRecommendationStatusUpdate,
} from "@/modules/ai-support-agent-management/lib/ai-support-agent-validation";
import type {
  SupportInsightListQuery,
  SupportInsightRecord,
  SupportRecommendationListQuery,
  SupportRecommendationRecord,
} from "@/modules/ai-support-agent-management/types/ai-support-agent-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export async function listSupportInsights(
  ownerId: string,
  query: SupportInsightListQuery = {},
): Promise<{ items: SupportInsightRecord[]; total: number; page: number; pageSize: number }> {
  const validated = validateSupportInsightListQuery(query);
  const businessId = await getOwnedBusinessId(ownerId);
  const page = validated.page ?? 1;
  const pageSize = validated.pageSize ?? 20;

  const where: Prisma.AISupportInsightWhereInput = {
    businessId,
    ...(validated.priority && validated.priority !== "ALL" ? { priority: validated.priority } : {}),
    ...(validated.status && validated.status !== "ALL" ? { status: validated.status } : {}),
    ...(validated.ticketId ? { ticketId: validated.ticketId } : {}),
    ...(validated.customerId ? { customerId: validated.customerId } : {}),
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
    prisma.aISupportInsight.count({ where }),
    prisma.aISupportInsight.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { customer: { select: { id: true, name: true } } },
    }),
  ]);

  return { items: items.map(serializeSupportInsight), total, page, pageSize };
}

export async function listSupportRecommendations(
  ownerId: string,
  query: SupportRecommendationListQuery = {},
): Promise<{
  items: SupportRecommendationRecord[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const validated = validateSupportRecommendationListQuery(query);
  const businessId = await getOwnedBusinessId(ownerId);
  const page = validated.page ?? 1;
  const pageSize = validated.pageSize ?? 20;

  const where: Prisma.AISupportRecommendationWhereInput = {
    businessId,
    ...(validated.status && validated.status !== "ALL" ? { status: validated.status } : {}),
    ...(validated.ticketId ? { ticketId: validated.ticketId } : {}),
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
    prisma.aISupportRecommendation.count({ where }),
    prisma.aISupportRecommendation.findMany({
      where,
      orderBy: [{ confidenceScore: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { customer: { select: { id: true, name: true } } },
    }),
  ]);

  return { items: items.map(serializeSupportRecommendation), total, page, pageSize };
}

export async function createSupportInsight(
  businessId: string,
  input: {
    customerId?: string;
    ticketId?: string;
    title: string;
    description?: string;
    priority?: SupportPriority;
    recommendation?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<SupportInsightRecord> {
  const insight = await prisma.aISupportInsight.create({
    data: {
      businessId,
      customerId: input.customerId,
      ticketId: input.ticketId,
      title: input.title,
      description: input.description,
      priority: input.priority ?? "MEDIUM",
      recommendation: input.recommendation,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
    include: { customer: { select: { id: true, name: true } } },
  });

  return serializeSupportInsight(insight);
}

export async function createSupportRecommendation(
  businessId: string,
  input: {
    ticketId?: string;
    customerId?: string;
    title: string;
    description?: string;
    action: string;
    confidenceScore?: number;
    metadata?: Record<string, unknown>;
  },
): Promise<SupportRecommendationRecord> {
  const recommendation = await prisma.aISupportRecommendation.create({
    data: {
      businessId,
      ticketId: input.ticketId,
      customerId: input.customerId,
      title: input.title,
      description: input.description,
      action: input.action,
      confidenceScore: input.confidenceScore,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
    include: { customer: { select: { id: true, name: true } } },
  });

  return serializeSupportRecommendation(recommendation);
}

export async function updateSupportRecommendationStatus(
  ownerId: string,
  recommendationId: string,
  status: string,
): Promise<SupportRecommendationRecord> {
  const validated = validateSupportRecommendationStatusUpdate(status);
  const businessId = await getOwnedBusinessId(ownerId);

  const existing = await prisma.aISupportRecommendation.findFirst({
    where: { id: recommendationId, businessId },
  });
  if (!existing) throw new Error("Recommendation not found");

  const updated = await prisma.aISupportRecommendation.update({
    where: { id: recommendationId },
    data: { status: validated },
    include: { customer: { select: { id: true, name: true } } },
  });

  return serializeSupportRecommendation(updated);
}

export async function dismissSupportInsight(
  ownerId: string,
  insightId: string,
): Promise<SupportInsightRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.aISupportInsight.findFirst({
    where: { id: insightId, businessId },
  });
  if (!existing) throw new Error("Insight not found");

  const updated = await prisma.aISupportInsight.update({
    where: { id: insightId },
    data: { status: "DISMISSED" },
    include: { customer: { select: { id: true, name: true } } },
  });

  return serializeSupportInsight(updated);
}

export async function searchSupportContent(
  ownerId: string,
  search: string,
): Promise<{ insights: SupportInsightRecord[]; recommendations: SupportRecommendationRecord[] }> {
  const [insights, recommendations] = await Promise.all([
    listSupportInsights(ownerId, { search, pageSize: 10 }),
    listSupportRecommendations(ownerId, { search, pageSize: 10 }),
  ]);

  return { insights: insights.items, recommendations: recommendations.items };
}
