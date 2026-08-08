import "server-only";

import { prisma } from "@/lib/prisma";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import {
  createSalesInsight,
  createSalesRecommendation,
} from "@/services/ai-sales-recommendation.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";

export interface QuoteAnalysisItem {
  id: string;
  quoteNumber: string;
  status: string;
  opportunityTitle: string;
  closeProbability: number;
  validUntil: string | null;
  sentAt: string | null;
}

const LIKELY_CLOSE_STATUSES = new Set(["SENT", "APPROVED"]);
const STALE_DAYS = 14;

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export async function analyzeQuotes(ownerId: string): Promise<QuoteAnalysisItem[]> {
  const businessId = await getOwnedBusinessId(ownerId);

  const quotes = await prisma.quote.findMany({
    where: { businessId, deletedAt: null, status: { notIn: ["ACCEPTED", "REJECTED", "EXPIRED"] } },
    include: {
      opportunity: {
        select: { name: true, stage: { select: { probabilityBps: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });

  return quotes.map((quote) => ({
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    status: quote.status,
    opportunityTitle: quote.opportunity.name,
    closeProbability: quote.opportunity.stage.probabilityBps / 100,
    validUntil: quote.validUntil?.toISOString() ?? null,
    sentAt: quote.sentAt?.toISOString() ?? null,
  }));
}

export async function getLikelyToCloseQuotes(ownerId: string): Promise<QuoteAnalysisItem[]> {
  const quotes = await analyzeQuotes(ownerId);
  return quotes.filter(
    (quote) => LIKELY_CLOSE_STATUSES.has(quote.status) && quote.closeProbability >= 40,
  );
}

export async function generateQuoteInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "sales",
    task: "quote-insights",
    loadContext: async (ownerId) => ({ ownerId }),
    persistInsight: (businessId, insight) =>
      createSalesInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "quotes",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
    persistRecommendation: (businessId, recommendation) =>
      createSalesRecommendation(businessId, {
        title: recommendation.title,
        description: recommendation.description,
        action: recommendation.action ?? recommendation.recommendation ?? "Review AI recommendation",
        priority: (recommendation.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        expectedImpact: recommendation.expectedImpact,
        metadata: recommendation.metadata,
      }),
  });
}
