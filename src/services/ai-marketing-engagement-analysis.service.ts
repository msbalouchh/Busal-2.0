import "server-only";

import { prisma } from "@/lib/prisma";
import { getCustomerAnalytics } from "@/services/reporting.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { createMarketingInsight } from "@/services/ai-marketing-recommendation.service";

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
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getEngagementSnapshot(ownerId);
  let created = 0;

  await createMarketingInsight(businessId, {
    title: "Engagement trends",
    description: `${snapshot.engagementRatePercent}% engagement rate · ${snapshot.loyaltyRedemptions} loyalty redemptions this period.`,
    category: "engagement",
    priority: snapshot.engagementRatePercent < 40 ? "HIGH" : "MEDIUM",
    recommendation:
      snapshot.engagementRatePercent < 40
        ? "Increase touchpoints with email, SMS, or in-app promotions."
        : "Maintain engagement with seasonal campaigns and loyalty rewards.",
    metadata: { snapshot },
  });
  created += 1;

  if (snapshot.loyaltyRedemptions === 0 && snapshot.loyaltyTransactions > 0) {
    await createMarketingInsight(businessId, {
      title: "Low loyalty redemption",
      description: "Customers are earning points but not redeeming rewards.",
      category: "engagement",
      priority: "HIGH",
      recommendation: "Promote available rewards and simplify redemption flow.",
      metadata: { loyaltyTransactions: snapshot.loyaltyTransactions },
    });
    created += 1;
  }

  return created;
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
