import "server-only";

import { getCrmDashboard } from "@/services/crm.service";
import { getCustomerAnalytics } from "@/services/reporting.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { createMarketingInsight } from "@/services/ai-marketing-recommendation.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";

export interface AudienceSnapshot {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  vipCustomers: number;
  marketingConsentCount: number;
  retentionRatePercent: number;
  loyaltyPointsOutstanding: number;
}

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export async function getAudienceSnapshot(ownerId: string): Promise<AudienceSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);
  const [crm, analytics] = await Promise.all([
    getCrmDashboard(businessId),
    getCustomerAnalytics(businessId),
  ]);

  return {
    totalCustomers: crm.totalCustomers,
    newCustomers: crm.newCustomers,
    returningCustomers: crm.returningCustomers,
    vipCustomers: crm.vipCustomers,
    marketingConsentCount: 0,
    retentionRatePercent: analytics.retentionRatePercent,
    loyaltyPointsOutstanding: crm.loyaltyStatistics.totalPointsOutstanding,
  };
}

export async function generateAudienceInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "marketing",
    task: "audience-insights",
    loadContext: getAudienceSnapshot,
    persistInsight: (businessId, insight) =>
      createMarketingInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "audience",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
  });
}
