import "server-only";

/** Orchestrates domain AI inference via delegated services. */


import { prisma } from "@/lib/prisma";
import { getCustomerAnalytics } from "@/services/reporting.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import {
  ensureSampleCampaigns,
  generateCampaignInsights,
  getCampaignAnalysisSnapshot,
} from "@/services/ai-marketing-campaign-analysis.service";
import {
  generateAudienceInsights,
  getAudienceSnapshot,
} from "@/services/ai-marketing-audience-analysis.service";
import {
  generateSegmentationInsights,
  listCustomerSegments,
} from "@/services/ai-marketing-segmentation.service";
import {
  generateEngagementInsights,
  getEngagementSnapshot,
} from "@/services/ai-marketing-engagement-analysis.service";
import {
  generatePromotionSuggestions,
  generateRetentionInsights,
  getRetentionSnapshot,
} from "@/services/ai-marketing-retention-analysis.service";
import {
  detectMarketingOpportunities,
  generateConversionInsights,
  generateWeeklyMarketingSummary,
  getMarketingTrendSnapshot,
} from "@/services/ai-marketing-trend-analysis.service";
import { listMarketingInsights } from "@/services/ai-marketing-recommendation.service";

export interface MarketingAgentDashboardStats {
  totalInsights: number;
  activeInsights: number;
  totalCampaigns: number;
  activeCampaigns: number;
  healthScore: number;
  healthLabel: string;
  retentionRatePercent: number;
  engagementRatePercent: number;
  atRiskCustomers: number;
}

export interface MarketingHealthBreakdown {
  score: number;
  label: string;
  factors: Array<{ name: string; score: number; weight: number }>;
}

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export function computeMarketingHealthScore(input: {
  retentionRatePercent: number;
  engagementRatePercent: number;
  activeCampaigns: number;
  atRiskCustomers: number;
  newCustomers: number;
}): MarketingHealthBreakdown {
  const factors = [
    { name: "Retention", score: input.retentionRatePercent, weight: 0.3 },
    { name: "Engagement", score: input.engagementRatePercent, weight: 0.25 },
    { name: "Campaign activity", score: Math.min(100, input.activeCampaigns * 30), weight: 0.2 },
    {
      name: "Churn risk",
      score: input.atRiskCustomers === 0 ? 100 : Math.max(20, 100 - input.atRiskCustomers * 5),
      weight: 0.15,
    },
    { name: "Acquisition", score: Math.min(100, input.newCustomers * 10), weight: 0.1 },
  ];

  const score = Math.round(factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0));
  const label =
    score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs attention";

  return { score, label, factors };
}

export async function getMarketingAgentDashboardStats(
  ownerId: string,
): Promise<MarketingAgentDashboardStats> {
  const businessId = await getOwnedBusinessId(ownerId);

  const [insightCounts, campaigns, retention, engagement, analytics] = await Promise.all([
    prisma.aIMarketingInsight.groupBy({
      by: ["status"],
      where: { businessId },
      _count: { _all: true },
    }),
    getCampaignAnalysisSnapshot(ownerId),
    getRetentionSnapshot(ownerId),
    getEngagementSnapshot(ownerId),
    getCustomerAnalytics(businessId),
  ]);

  const totalInsights = insightCounts.reduce((sum, row) => sum + row._count._all, 0);
  const activeInsights = insightCounts.find((row) => row.status === "ACTIVE")?._count._all ?? 0;

  const health = computeMarketingHealthScore({
    retentionRatePercent: retention.retentionRatePercent,
    engagementRatePercent: engagement.engagementRatePercent,
    activeCampaigns: campaigns.activeCampaigns,
    atRiskCustomers: retention.atRiskCount,
    newCustomers: analytics.newCustomers,
  });

  return {
    totalInsights,
    activeInsights,
    totalCampaigns: campaigns.totalCampaigns,
    activeCampaigns: campaigns.activeCampaigns,
    healthScore: health.score,
    healthLabel: health.label,
    retentionRatePercent: retention.retentionRatePercent,
    engagementRatePercent: engagement.engagementRatePercent,
    atRiskCustomers: retention.atRiskCount,
  };
}

export async function runMarketingAnalysis(ownerId: string): Promise<{ insightsCreated: number }> {
  await ensureSampleCampaigns(ownerId);

  const results = await Promise.all([
    generateCampaignInsights(ownerId),
    generateAudienceInsights(ownerId),
    generateSegmentationInsights(ownerId),
    generateEngagementInsights(ownerId),
    generateRetentionInsights(ownerId),
    generatePromotionSuggestions(ownerId),
    generateWeeklyMarketingSummary(ownerId),
    generateConversionInsights(ownerId),
  ]);

  await detectMarketingOpportunities(ownerId);

  return { insightsCreated: results.reduce((sum, count) => sum + count, 0) + 1 };
}

export async function getMarketingAnalysisSummary(ownerId: string) {
  await ensureSampleCampaigns(ownerId);

  const [
    stats,
    insights,
    promotions,
    segments,
    audience,
    retention,
    engagement,
    trends,
    campaigns,
  ] = await Promise.all([
    getMarketingAgentDashboardStats(ownerId),
    listMarketingInsights(ownerId, { pageSize: 5, status: "ACTIVE" }),
    listMarketingInsights(ownerId, { category: "promotion", pageSize: 5, status: "ACTIVE" }),
    listCustomerSegments(ownerId),
    getAudienceSnapshot(ownerId),
    getRetentionSnapshot(ownerId),
    getEngagementSnapshot(ownerId),
    getMarketingTrendSnapshot(ownerId),
    getCampaignAnalysisSnapshot(ownerId),
  ]);

  return {
    stats,
    insights,
    promotions,
    segments,
    audience,
    retention,
    engagement,
    trends,
    campaigns,
  };
}
