import "server-only";

import { prisma } from "@/lib/prisma";
import { getCloudBusinessId } from "@/services/cloud-platform-context.service";

export async function checkQuota(
  ownerId: string,
  resource: string,
): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
}> {
  const businessId = await getCloudBusinessId(ownerId);
  const latest = await prisma.platformCloudUsageMetric.findFirst({
    where: { tenant: { businessId }, resource },
    orderBy: { recordedAt: "desc" },
  });

  const current = latest?.value ?? 0;
  const limit = latest?.limit ?? 0;
  const remaining = limit > 0 ? Math.max(0, limit - current) : Infinity;
  const allowed = limit <= 0 || current < limit;

  return { allowed, current, limit, remaining: remaining === Infinity ? -1 : remaining };
}

export async function enforceQuota(
  ownerId: string,
  resource: string,
  increment = 1,
): Promise<boolean> {
  const check = await checkQuota(ownerId, resource);
  if (!check.allowed) return false;

  const { recordUsageMetric } = await import("@/services/usage-metering.service");
  await recordUsageMetric(ownerId, {
    resource,
    value: check.current + increment,
    limit: check.limit,
  });
  return true;
}

export async function getQuotaDashboard(ownerId: string) {
  const { getUsageSummary } = await import("@/services/usage-metering.service");
  const usage = await getUsageSummary(ownerId);
  return usage.map((entry) => ({
    ...entry,
    status: entry.limit > 0 && entry.value >= entry.limit ? "exceeded" : "ok",
  }));
}
