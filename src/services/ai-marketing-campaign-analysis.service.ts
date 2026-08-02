import "server-only";

import type { CampaignStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { createMarketingInsight } from "@/services/ai-marketing-recommendation.service";

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
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getCampaignAnalysisSnapshot(ownerId);
  let created = 0;

  await createMarketingInsight(businessId, {
    title: "Campaign portfolio overview",
    description: `${snapshot.activeCampaigns} active, ${snapshot.plannedCampaigns} planned, ${snapshot.completedCampaigns} completed campaigns.`,
    category: "campaign",
    priority: snapshot.activeCampaigns === 0 ? "HIGH" : "MEDIUM",
    recommendation:
      snapshot.plannedCampaigns > 0
        ? "Review planned campaigns and activate high-priority initiatives."
        : "Plan a new acquisition or retention campaign for the upcoming period.",
    metadata: { snapshot },
  });
  created += 1;

  const active = snapshot.campaigns.filter((c) => c.status === "ACTIVE");
  if (active.length > 0) {
    await createMarketingInsight(businessId, {
      title: "Active campaign performance",
      description: `${active.length} campaigns currently running: ${active.map((c) => c.name).join(", ")}.`,
      category: "campaign",
      priority: "MEDIUM",
      recommendation: "Monitor engagement metrics and adjust targeting mid-campaign if needed.",
      metadata: { campaignIds: active.map((c) => c.id) },
    });
    created += 1;
  }

  return created;
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
