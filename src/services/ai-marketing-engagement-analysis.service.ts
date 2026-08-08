import "server-only";

import { prisma } from "@/lib/prisma";
import { getCustomerAnalytics } from "@/services/reporting.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { createMarketingInsight } from "@/services/ai-marketing-recommendation.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";

export interface EngagementSnapshot {
  returningCustomers: number;
  newCustomers: number;
  loyaltyRedemptions: number;
  loyaltyTransactions: number;
  engagementRatePercent: number;
}

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export async function getEngagementSnapshot(ownerId: string): Promise<EngagementSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);
  const analytics = await getCustomerAnalytics(businessId);
  const total = analytics.newCustomers + analytics.returningCustomers;
  const engagementRatePercent =
    total === 0 ? 0 : Math.round((analytics.returningCustomers / total) * 100);

  return {
    returningCustomers: analytics.returningCustomers,
    newCustomers: analytics.newCustomers,
    loyaltyRedemptions: analytics.loyaltyUsage.totalRedemptions,
    loyaltyTransactions: analytics.loyaltyUsage.totalPointTransactions,
    engagementRatePercent,
  };
}

export async function generateEngagementInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "marketing",
    task: "engagement-insights",
    loadContext: getEngagementSnapshot,
    persistInsight: (businessId, insight) =>
      createMarketingInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "engagement",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
  });
}

export async function getEngagementTimeline(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const [insights, campaigns] = await Promise.all([
    prisma.aIMarketingInsight.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, title: true, category: true, createdAt: true, priority: true },
    }),
    prisma.aIMarketingCampaign.findMany({
      where: { businessId },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: { id: true, name: true, status: true, updatedAt: true, type: true },
    }),
  ]);

  return { insights, campaigns };
}
