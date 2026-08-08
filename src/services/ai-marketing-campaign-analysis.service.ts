import "server-only";

import type { CampaignStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { createMarketingInsight } from "@/services/ai-marketing-recommendation.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";

export interface CampaignPerformanceItem {
  id: string;
  name: string;
  type: string;
  status: CampaignStatus;
  objective: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
}

export interface CampaignAnalysisSnapshot {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  plannedCampaigns: number;
  campaigns: CampaignPerformanceItem[];
}

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

function serializeCampaign(campaign: {
  id: string;
  name: string;
  type: string;
  status: CampaignStatus;
  objective: string | null;
  startDate: Date | null;
  endDate: Date | null;
  budget: number | null;
}): CampaignPerformanceItem {
  return {
    id: campaign.id,
    name: campaign.name,
    type: campaign.type,
    status: campaign.status,
    objective: campaign.objective,
    startDate: campaign.startDate?.toISOString() ?? null,
    endDate: campaign.endDate?.toISOString() ?? null,
    budget: campaign.budget,
  };
}

export async function getCampaignAnalysisSnapshot(
  ownerId: string,
): Promise<CampaignAnalysisSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);
  const campaigns = await prisma.aIMarketingCampaign.findMany({
    where: { businessId },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c) => c.status === "ACTIVE").length,
    completedCampaigns: campaigns.filter((c) => c.status === "COMPLETED").length,
    plannedCampaigns: campaigns.filter((c) => c.status === "PLANNED").length,
    campaigns: campaigns.map(serializeCampaign),
  };
}

export async function listMarketingCampaigns(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const campaigns = await prisma.aIMarketingCampaign.findMany({
    where: { businessId },
    orderBy: { updatedAt: "desc" },
  });
  return campaigns.map(serializeCampaign);
}

export async function generateCampaignInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "marketing",
    task: "campaign-insights",
    loadContext: getCampaignAnalysisSnapshot,
    persistInsight: (businessId, insight) =>
      createMarketingInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "campaign",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
  });
}

export async function ensureSampleCampaigns(ownerId: string): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const count = await prisma.aIMarketingCampaign.count({ where: { businessId } });
  if (count > 0) return;

  const now = new Date();
  const weekendEnd = new Date(now);
  weekendEnd.setDate(weekendEnd.getDate() + 3);

  await prisma.aIMarketingCampaign.createMany({
    data: [
      {
        businessId,
        name: "Weekend Promotion",
        type: "promotion",
        status: "PLANNED",
        objective: "Increase weekend footfall and order volume",
        targetAudience: "Returning customers",
        startDate: now,
        endDate: weekendEnd,
        budget: 50000,
      },
      {
        businessId,
        name: "Loyalty Re-engagement",
        type: "loyalty",
        status: "ACTIVE",
        objective: "Win back inactive loyalty members",
        targetAudience: "Inactive customers (60+ days)",
        startDate: now,
        budget: 25000,
      },
    ],
  });
}
