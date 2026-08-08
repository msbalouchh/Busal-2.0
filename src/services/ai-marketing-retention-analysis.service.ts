import "server-only";

import { prisma } from "@/lib/prisma";
import { getCustomerAnalytics } from "@/services/reporting.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { createMarketingInsight } from "@/services/ai-marketing-recommendation.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";

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
  return runOwnerDomainInsightTask(ownerId, {
    module: "marketing",
    task: "retention-insights",
    loadContext: getRetentionSnapshot,
    persistInsight: (businessId, insight) =>
      createMarketingInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "retention",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
  });
}

export async function generatePromotionSuggestions(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "marketing",
    task: "promotion-suggestions",
    loadContext: async (ownerId) => ({ ownerId }),
    persistInsight: (businessId, insight) =>
      createMarketingInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "promotion",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
  });
}
