import "server-only";

import { prisma } from "@/lib/prisma";
import { getCustomerAnalytics } from "@/services/reporting.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { createMarketingInsight } from "@/services/ai-marketing-recommendation.service";

export interface RetentionSnapshot {
  retentionRatePercent: number;
  returningCustomers: number;
  newCustomers: number;
  atRiskCount: number;
}

const AT_RISK_DAYS = 60;

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export async function getRetentionSnapshot(ownerId: string): Promise<RetentionSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);
  const analytics = await getCustomerAnalytics(businessId);

  const atRiskCount = await prisma.customer.count({
    where: {
      businessId,
      deletedAt: null,
      status: "ACTIVE",
      OR: [
        { lastOrderAt: { lt: new Date(Date.now() - AT_RISK_DAYS * 86400000) } },
        { lastOrderAt: null, createdAt: { lt: new Date(Date.now() - AT_RISK_DAYS * 86400000) } },
      ],
    },
  });

  return {
    retentionRatePercent: analytics.retentionRatePercent,
    returningCustomers: analytics.returningCustomers,
    newCustomers: analytics.newCustomers,
    atRiskCount,
  };
}

export async function generateRetentionInsights(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getRetentionSnapshot(ownerId);
  let created = 0;

  await createMarketingInsight(businessId, {
    title: "Retention analysis",
    description: `${snapshot.retentionRatePercent}% retention rate · ${snapshot.atRiskCount} customers at risk.`,
    category: "retention",
    priority: snapshot.retentionRatePercent < 50 ? "CRITICAL" : "MEDIUM",
    recommendation:
      snapshot.atRiskCount > 0
        ? "Deploy a retention campaign targeting inactive customers before they churn."
        : "Retention is healthy — focus on loyalty program expansion.",
    metadata: { snapshot },
  });
  created += 1;

  return created;
}

export async function generatePromotionSuggestions(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  let created = 0;
  const day = new Date().getDay();
  const isWeekend = day === 0 || day === 5 || day === 6;

  if (isWeekend) {
    await createMarketingInsight(businessId, {
      title: "Weekend promotion suggestion",
      description:
        "Weekends typically drive higher footfall — capitalize with a limited-time offer.",
      category: "promotion",
      priority: "HIGH",
      recommendation: "Run a 10–15% discount on best-selling items this weekend.",
      metadata: { suggestionType: "weekend" },
    });
    created += 1;
  }

  await createMarketingInsight(businessId, {
    title: "Loyalty campaign suggestion",
    description: "Reward loyal customers to boost repeat visits and referrals.",
    category: "promotion",
    priority: "MEDIUM",
    recommendation: "Double loyalty points for customers who haven't ordered in 30 days.",
    metadata: { suggestionType: "loyalty" },
  });
  created += 1;

  return created;
}
