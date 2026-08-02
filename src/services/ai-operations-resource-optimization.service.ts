import "server-only";

import { getStaffAnalytics } from "@/services/reporting.service";
import { getStaffDashboard } from "@/services/restaurant-analytics.service";
import {
  createOperationInsight,
  createOperationRecommendation,
} from "@/services/ai-operations-efficiency-recommendation.service";
import {
  getOwnedBusinessId,
  getPrimaryBranchId,
  weekAnalyticsFilters,
} from "@/services/ai-operations-context.service";
import { prisma } from "@/lib/prisma";

export interface ResourceUtilizationSnapshot {
  activeStaff: number;
  staffWithOrders: number;
  utilizationRate: number;
  topPerformers: Array<{ name: string; ordersHandled: number }>;
  underutilized: Array<{ name: string; ordersHandled: number }>;
}

export async function getResourceUtilizationSnapshot(
  ownerId: string,
): Promise<ResourceUtilizationSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);

  const [activeStaff, analytics] = await Promise.all([
    prisma.staff.count({
      where: { businessId, isActive: true, employmentStatus: "ACTIVE" },
    }),
    getStaffAnalytics(businessId),
  ]);

  const staffWithOrders = analytics.filter((s) => s.ordersHandled > 0).length;
  const utilizationRate = activeStaff > 0 ? Math.round((staffWithOrders / activeStaff) * 100) : 0;

  const sorted = analytics
    .map((s) => ({ name: s.staffName, ordersHandled: s.ordersHandled }))
    .sort((a, b) => b.ordersHandled - a.ordersHandled);

  const avgOrders =
    sorted.length > 0 ? sorted.reduce((sum, s) => sum + s.ordersHandled, 0) / sorted.length : 0;

  return {
    activeStaff,
    staffWithOrders,
    utilizationRate,
    topPerformers: sorted.slice(0, 5),
    underutilized: sorted.filter((s) => s.ordersHandled < avgOrders / 2).slice(0, 5),
  };
}

export async function generateResourceOptimizationInsights(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getResourceUtilizationSnapshot(ownerId);
  let created = 0;

  if (snapshot.utilizationRate < 60 && snapshot.activeStaff > 0) {
    await createOperationInsight(businessId, {
      title: "Low staff utilization",
      description: `Only ${snapshot.utilizationRate}% of active staff processed orders today.`,
      category: "resource",
      priority: "HIGH",
      recommendation: "Reallocate staff to high-demand stations or adjust schedules.",
      metadata: { utilizationRate: snapshot.utilizationRate },
    });
    created += 1;
  }

  const branchId = await getPrimaryBranchId(businessId);
  const staffDash = await getStaffDashboard(ownerId, weekAnalyticsFilters(branchId));

  for (const performer of snapshot.underutilized.slice(0, 2)) {
    await createOperationRecommendation(businessId, {
      title: `Staff allocation: ${performer.name}`,
      description: `${performer.name} handled ${performer.ordersHandled} orders — below team average.`,
      action: "Assign to busier shift or cross-train for kitchen/support roles.",
      expectedImpact: "Improved team productivity and customer wait times",
      confidenceScore: 0.75,
      metadata: { staffName: performer.name, type: "staff_allocation" },
    });
    created += 1;
  }

  if (staffDash.performance.length > 0) {
    await createOperationInsight(businessId, {
      title: "Staff productivity overview",
      description: staffDash.performance
        .slice(0, 5)
        .map((row) => row.cells.join(": "))
        .join(" · "),
      category: "efficiency",
      priority: "MEDIUM",
      recommendation: "Balance workload across top and underutilized staff.",
      metadata: { performance: staffDash.performance.slice(0, 5) },
    });
    created += 1;
  }

  return created;
}
