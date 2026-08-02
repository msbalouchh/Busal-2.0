import "server-only";

import type { Prisma, MarketingPriority } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  serializeMarketingInsight,
  validateMarketingInsightListQuery,
} from "@/modules/ai-marketing-agent-management/lib/ai-marketing-agent-validation";
import type {
  MarketingInsightListQuery,
  MarketingInsightRecord,
} from "@/modules/ai-marketing-agent-management/types/ai-marketing-agent-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export async function listMarketingInsights(
  ownerId: string,
  query: MarketingInsightListQuery = {},
): Promise<{ items: MarketingInsightRecord[]; total: number; page: number; pageSize: number }> {
  const validated = validateMarketingInsightListQuery(query);
  const businessId = await getOwnedBusinessId(ownerId);
  const page = validated.page ?? 1;
  const pageSize = validated.pageSize ?? 20;

  const where: Prisma.AIMarketingInsightWhereInput = {
    businessId,
    ...(validated.category && validated.category !== "ALL" ? { category: validated.category } : {}),
    ...(validated.priority && validated.priority !== "ALL" ? { priority: validated.priority } : {}),
    ...(validated.status && validated.status !== "ALL" ? { status: validated.status } : {}),
    ...(validated.search?.trim()
      ? {
          OR: [
            { title: { contains: validated.search.trim(), mode: "insensitive" } },
            { description: { contains: validated.search.trim(), mode: "insensitive" } },
            { recommendation: { contains: validated.search.trim(), mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.aIMarketingInsight.count({ where }),
    prisma.aIMarketingInsight.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { items: items.map(serializeMarketingInsight), total, page, pageSize };
}

export async function createMarketingInsight(
  businessId: string,
  input: {
    title: string;
    description?: string;
    category: string;
    priority?: MarketingPriority;
    recommendation?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<MarketingInsightRecord> {
  const insight = await prisma.aIMarketingInsight.create({
    data: {
      businessId,
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority ?? "MEDIUM",
      recommendation: input.recommendation,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });

  return serializeMarketingInsight(insight);
}

export async function dismissMarketingInsight(
  ownerId: string,
  insightId: string,
): Promise<MarketingInsightRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.aIMarketingInsight.findFirst({
    where: { id: insightId, businessId },
  });
  if (!existing) throw new Error("Insight not found");

  const updated = await prisma.aIMarketingInsight.update({
    where: { id: insightId },
    data: { status: "DISMISSED" },
  });

  return serializeMarketingInsight(updated);
}

export async function searchMarketingContent(
  ownerId: string,
  search: string,
): Promise<{ insights: MarketingInsightRecord[] }> {
  const result = await listMarketingInsights(ownerId, { search, pageSize: 10 });
  return { insights: result.items };
}

export async function listPromotionSuggestions(ownerId: string): Promise<MarketingInsightRecord[]> {
  const result = await listMarketingInsights(ownerId, {
    category: "promotion",
    status: "ACTIVE",
    pageSize: 10,
  });
  return result.items;
}
