import "server-only";

import { getCrmDashboard } from "@/services/crm.service";
import { getCustomerAnalytics } from "@/services/reporting.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { createMarketingInsight } from "@/services/ai-marketing-recommendation.service";

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
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getAudienceSnapshot(ownerId);
  let created = 0;

  await createMarketingInsight(businessId, {
    title: "Audience overview",
    description: `${snapshot.totalCustomers} total customers · ${snapshot.newCustomers} new this month · ${snapshot.retentionRatePercent}% retention.`,
    category: "audience",
    priority: "MEDIUM",
    recommendation:
      snapshot.newCustomers < snapshot.returningCustomers
        ? "Focus acquisition campaigns to balance new vs returning customer ratio."
        : "Strong returning base — prioritize loyalty and upsell campaigns.",
    metadata: { snapshot },
  });
  created += 1;

  if (snapshot.vipCustomers > 0) {
    await createMarketingInsight(businessId, {
      title: "VIP audience segment",
      description: `${snapshot.vipCustomers} VIP customers identified for premium campaigns.`,
      category: "audience",
      priority: "HIGH",
      recommendation: "Launch exclusive offers or early-access promotions for VIP segment.",
      metadata: { vipCustomers: snapshot.vipCustomers },
    });
    created += 1;
  }

  return created;
}
