import "server-only";

import { prisma } from "@/lib/prisma";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import {
  createSalesInsight,
  createSalesRecommendation,
} from "@/services/ai-sales-recommendation.service";

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
  const businessId = await getOwnedBusinessId(ownerId);
  const quotes = await analyzeQuotes(ownerId);
  let created = 0;

  const likelyClose = quotes.filter((q) => LIKELY_CLOSE_STATUSES.has(q.status));
  if (likelyClose.length > 0) {
    await createSalesInsight(businessId, {
      title: "Quotes likely to close",
      description: `${likelyClose.length} quotes are in sent or approved status with active opportunities.`,
      category: "quotes",
      priority: "HIGH",
      recommendation: "Follow up on sent quotes within 48 hours to accelerate closure.",
      metadata: { quoteIds: likelyClose.map((q) => q.id) },
    });
    created += 1;
  }

  const staleCutoff = new Date(Date.now() - STALE_DAYS * 86400000);
  const staleQuotes = quotes.filter((q) => q.sentAt && new Date(q.sentAt) < staleCutoff);
  for (const quote of staleQuotes.slice(0, 3)) {
    await createSalesRecommendation(businessId, {
      title: `Follow up on quote ${quote.quoteNumber}`,
      description: `Quote for "${quote.opportunityTitle}" has been pending for over ${STALE_DAYS} days.`,
      action: "Schedule follow-up call or send reminder email",
      priority: "HIGH",
      expectedImpact: "Recover stalled deal",
      metadata: { quoteId: quote.id },
    });
    created += 1;
  }

  return created;
}
