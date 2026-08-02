import "server-only";

import { prisma } from "@/lib/prisma";
import { getStaffAnalytics } from "@/services/reporting.service";
import { createHrInsight, createHrRecommendation } from "@/services/ai-hr-insight.service";
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
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getPerformanceSnapshot(ownerId);
  let created = 0;

  if (snapshot.topPerformers.length > 0) {
    const top = snapshot.topPerformers[0]!;
    await createHrInsight(businessId, {
      staffId: top.staffId,
      title: "High-performing employee identified",
      description: `${top.name} handled ${top.ordersHandled} orders this period.`,
      category: "performance",
      priority: "MEDIUM",
      recommendation: "Recognize top performers and consider mentorship roles.",
      metadata: { ordersHandled: top.ordersHandled },
    });
    created += 1;
  }

  if (snapshot.lowPerformers.length > 0) {
    await createHrInsight(businessId, {
      title: "Performance coaching opportunity",
      description: `${snapshot.lowPerformers.length} staff members are below average activity.`,
      category: "performance",
      priority: "HIGH",
      recommendation: "Schedule performance reviews and identify training needs.",
      metadata: { staffIds: snapshot.lowPerformers.map((p) => p.staffId) },
    });
    created += 1;
  }

  for (const performer of snapshot.topPerformers.slice(0, 2)) {
    await createHrRecommendation(businessId, {
      staffId: performer.staffId,
      title: `Recognize ${performer.name}`,
      description: `Strong performance with ${performer.ordersHandled} orders handled.`,
      action: "Consider bonus, recognition, or leadership development opportunity.",
      confidenceScore: 0.85,
      metadata: { type: "performance_recognition" },
    });
    created += 1;
  }

  return created;
}
