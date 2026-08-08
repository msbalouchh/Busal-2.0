import "server-only";

import { prisma } from "@/lib/prisma";
import { getStaffAnalytics } from "@/services/reporting.service";
import { createHrInsight, createHrRecommendation } from "@/services/ai-hr-insight.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export interface PerformanceSnapshot {
  topPerformers: Array<{
    staffId: string;
    name: string;
    ordersHandled: number;
    revenuePence: number;
  }>;
  lowPerformers: Array<{
    staffId: string;
    name: string;
    ordersHandled: number;
    revenuePence: number;
  }>;
  avgOrdersPerStaff: number;
  totalActiveStaff: number;
}

export async function getPerformanceSnapshot(ownerId: string): Promise<PerformanceSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);
  const [analytics, activeCount] = await Promise.all([
    getStaffAnalytics(businessId),
    prisma.staff.count({ where: { businessId, isActive: true, employmentStatus: "ACTIVE" } }),
  ]);

  const performers = analytics
    .map((item) => ({
      staffId: item.staffId,
      name: item.staffName,
      ordersHandled: item.ordersHandled,
      revenuePence: item.salesProcessedPence,
    }))
    .sort((a, b) => b.ordersHandled - a.ordersHandled);

  const avgOrders =
    performers.length > 0
      ? Math.round(performers.reduce((sum, p) => sum + p.ordersHandled, 0) / performers.length)
      : 0;

  return {
    topPerformers: performers.slice(0, 5),
    lowPerformers: performers.filter((p) => p.ordersHandled < avgOrders / 2).slice(0, 5),
    avgOrdersPerStaff: avgOrders,
    totalActiveStaff: activeCount,
  };
}

export async function generatePerformanceInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "hr",
    task: "performance-insights",
    loadContext: getPerformanceSnapshot,
    persistInsight: (businessId, insight) =>
      createHrInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "performance",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
    persistRecommendation: (businessId, recommendation) =>
      createHrRecommendation(businessId, {
        title: recommendation.title,
        description: recommendation.description,
        action: recommendation.action ?? recommendation.recommendation ?? "Review AI recommendation",
        confidenceScore: recommendation.confidenceScore,
        metadata: recommendation.metadata,
      }),
  });
}
