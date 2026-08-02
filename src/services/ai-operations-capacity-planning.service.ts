import "server-only";

import { prisma } from "@/lib/prisma";
import { getReservationsDashboard } from "@/services/restaurant-analytics.service";
import { createOperationInsight } from "@/services/ai-operations-efficiency-recommendation.service";
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
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getCapacitySnapshot(ownerId);
  let created = 0;

  await createOperationInsight(businessId, {
    title: "Capacity planning summary",
    description: `${snapshot.capacityUtilization}% table utilization · ${snapshot.activeStaff} staff · ${snapshot.activeTables} tables.`,
    category: "capacity",
    priority: snapshot.capacityUtilization > 90 ? "HIGH" : "MEDIUM",
    recommendation: snapshot.recommendation,
    metadata: { capacityUtilization: snapshot.capacityUtilization },
  });
  created += 1;

  return created;
}
