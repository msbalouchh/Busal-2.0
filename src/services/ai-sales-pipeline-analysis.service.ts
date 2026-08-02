import "server-only";

import { prisma } from "@/lib/prisma";
import { getSalesDashboard as getCrmSalesDashboard } from "@/services/sales-crm.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { createSalesInsight } from "@/services/ai-sales-recommendation.service";

export interface PipelineStageInsight {
  stageName: string;
  count: number;
  valuePence: number;
}

export interface PipelineAnalysisSnapshot {
  totalLeads: number;
  openLeads: number;
  totalOpportunities: number;
  openOpportunityValuePence: number;
  wonOpportunityValuePence: number;
  stages: PipelineStageInsight[];
  pendingTasks: number;
  upcomingDemos: number;
}

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export async function getPipelineAnalysisSnapshot(
  ownerId: string,
): Promise<PipelineAnalysisSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);
  const dashboard = await getCrmSalesDashboard(businessId);

  return {
    totalLeads: dashboard.totalLeads,
    openLeads: dashboard.openLeads,
    totalOpportunities: dashboard.totalOpportunities,
    openOpportunityValuePence: dashboard.openOpportunityValuePence,
    wonOpportunityValuePence: dashboard.wonOpportunityValuePence,
    stages: dashboard.stageBreakdown,
    pendingTasks: dashboard.pendingTasks,
    upcomingDemos: dashboard.upcomingDemos,
  };
}

export async function generatePipelineInsights(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getPipelineAnalysisSnapshot(ownerId);
  let created = 0;

  await createSalesInsight(businessId, {
    title: "Pipeline overview",
    description: `${snapshot.totalOpportunities} total opportunities with £${(snapshot.openOpportunityValuePence / 100).toFixed(2)} in open pipeline value.`,
    category: "pipeline",
    priority: snapshot.totalOpportunities === 0 ? "HIGH" : "MEDIUM",
    recommendation:
      snapshot.openLeads > 0
        ? `${snapshot.openLeads} leads awaiting qualification. Review and convert to opportunities.`
        : "Focus on generating new leads to fill the pipeline.",
    metadata: { snapshot },
  });
  created += 1;

  const bottleneck = snapshot.stages.find((stage) => stage.count >= 3);
  if (bottleneck) {
    await createSalesInsight(businessId, {
      title: `Pipeline bottleneck: ${bottleneck.stageName}`,
      description: `${bottleneck.count} opportunities stuck at ${bottleneck.stageName} stage.`,
      category: "pipeline",
      priority: "HIGH",
      recommendation: `Review ${bottleneck.stageName} stage deals and schedule follow-ups.`,
      metadata: { stage: bottleneck },
    });
    created += 1;
  }

  if (snapshot.pendingTasks > 0) {
    await createSalesInsight(businessId, {
      title: "Pending sales tasks",
      description: `${snapshot.pendingTasks} sales tasks require attention.`,
      category: "follow_up",
      priority: snapshot.pendingTasks > 5 ? "CRITICAL" : "HIGH",
      recommendation: "Complete overdue tasks to maintain pipeline momentum.",
      metadata: { pendingTasks: snapshot.pendingTasks },
    });
    created += 1;
  }

  return created;
}

export async function listPipelineOpportunities(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);

  return prisma.salesOpportunity.findMany({
    where: { businessId, deletedAt: null, stage: { isWon: false, isLost: false } },
    include: {
      stage: { select: { name: true, probabilityBps: true } },
      company: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
}
