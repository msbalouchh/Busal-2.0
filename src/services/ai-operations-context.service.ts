import "server-only";

/** Non-inference service — no parallel AI execution. */

import { prisma } from "@/lib/prisma";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import type {
  AnalyticsFilters,
  AnalyticsDateRange,
} from "@/modules/restaurant-analytics-management/types/restaurant-analytics-types";

function todayDateRange(): AnalyticsDateRange {
  const today = new Date().toISOString().slice(0, 10);
  return { from: today, to: today };
}

function weekDateRange(): AnalyticsDateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 6);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export async function getPrimaryBranchId(businessId: string): Promise<string | null> {
  const branch = await prisma.branch.findFirst({
    where: { businessId, isActive: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  return branch?.id ?? null;
}

export function defaultAnalyticsFilters(branchId?: string | null): AnalyticsFilters {
  return {
    branchId: branchId ?? undefined,
    dateRange: todayDateRange(),
  };
}

export function weekAnalyticsFilters(branchId?: string | null): AnalyticsFilters {
  return {
    branchId: branchId ?? undefined,
    dateRange: weekDateRange(),
  };
}
