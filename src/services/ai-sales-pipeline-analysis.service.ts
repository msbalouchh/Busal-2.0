import "server-only";

import { prisma } from "@/lib/prisma";
import { getSalesDashboard as getCrmSalesDashboard } from "@/services/sales-crm.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { createSalesInsight } from "@/services/ai-sales-recommendation.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";

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
  return runOwnerDomainInsightTask(ownerId, {
    module: "sales",
    task: "pipeline-insights",
    loadContext: getPipelineAnalysisSnapshot,
    persistInsight: (businessId, insight) =>
      createSalesInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "pipeline",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
  });
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
