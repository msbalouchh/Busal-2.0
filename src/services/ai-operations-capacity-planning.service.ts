import "server-only";

import { prisma } from "@/lib/prisma";
import { getReservationsDashboard } from "@/services/restaurant-analytics.service";
import { createOperationInsight } from "@/services/ai-operations-efficiency-recommendation.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";
import {
  defaultAnalyticsFilters,
  getOwnedBusinessId,
  getPrimaryBranchId,
} from "@/services/ai-operations-context.service";

export interface CapacitySnapshot {
  activeStaff: number;
  activeTables: number;
  reservationsToday: number;
  totalCovers: number;
  capacityUtilization: number;
  recommendation: string;
}

export async function getCapacitySnapshot(ownerId: string): Promise<CapacitySnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);
  const branchId = await getPrimaryBranchId(businessId);

  const [activeStaff, activeTables, reservations] = await Promise.all([
    prisma.staff.count({
      where: { businessId, isActive: true, employmentStatus: "ACTIVE" },
    }),
    prisma.restaurantTable.count({
      where: {
        businessId,
        ...(branchId ? { branchId } : {}),
      },
    }),
    getReservationsDashboard(ownerId, defaultAnalyticsFilters(branchId)),
  ]);

  const reservationsToday = Number(reservations.kpis[0]?.value ?? 0);
  const totalCovers = Number(reservations.kpis[1]?.value ?? 0);
  const tableCapacity = activeTables * 4;
  const capacityUtilization =
    tableCapacity > 0 ? Math.min(100, Math.round((totalCovers / tableCapacity) * 100)) : 0;

  let recommendation = "Capacity is balanced for current demand.";
  if (capacityUtilization > 85) {
    recommendation = "Near capacity — consider waitlist management and extended hours.";
  } else if (capacityUtilization < 30 && reservationsToday > 0) {
    recommendation = "Low utilization — optimize table turns and marketing.";
  } else if (activeStaff < activeTables / 4) {
    recommendation = "Staff-to-table ratio low — add floor staff for service quality.";
  }

  return {
    activeStaff,
    activeTables,
    reservationsToday,
    totalCovers,
    capacityUtilization,
    recommendation,
  };
}

export async function generateCapacityInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "operations",
    task: "capacity-insights",
    loadContext: getCapacitySnapshot,
    persistInsight: (businessId, insight) =>
      createOperationInsight(businessId, {
        title: insight.title,
        description: insight.description,
        category: insight.category ?? "capacity",
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
  });
}
