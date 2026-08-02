import "server-only";

import { prisma } from "@/lib/prisma";
import { getCloudBusinessId } from "@/services/cloud-platform-context.service";

export async function recordUsageMetric(
  ownerId: string,
  input: { resource: string; value: number; limit?: number; period?: string },
) {
  const businessId = await getCloudBusinessId(ownerId);
  const tenant = await prisma.platformCloudTenant.findUnique({ where: { businessId } });
  if (!tenant) return null;

  return prisma.platformCloudUsageMetric.create({
    data: {
      tenantId: tenant.id,
      resource: input.resource,
      value: input.value,
      limit: input.limit ?? 0,
      period: input.period ?? "monthly",
    },
  });
}

export async function listUsageMetrics(ownerId: string, resource?: string) {
  const businessId = await getCloudBusinessId(ownerId);
  return prisma.platformCloudUsageMetric.findMany({
    where: {
      tenant: { businessId },
      ...(resource ? { resource } : {}),
    },
    orderBy: { recordedAt: "desc" },
    take: 100,
  });
}

export async function getUsageSummary(ownerId: string) {
  const businessId = await getCloudBusinessId(ownerId);
  const metrics = await prisma.platformCloudUsageMetric.findMany({
    where: { tenant: { businessId } },
    orderBy: { recordedAt: "desc" },
    take: 200,
  });

  const latestByResource = new Map<string, (typeof metrics)[0]>();
  for (const metric of metrics) {
    if (!latestByResource.has(metric.resource)) {
      latestByResource.set(metric.resource, metric);
    }
  }

  return Array.from(latestByResource.values()).map((m) => ({
    resource: m.resource,
    value: m.value,
    limit: m.limit,
    utilization: m.limit > 0 ? Math.round((m.value / m.limit) * 100) : 0,
    period: m.period,
    recordedAt: m.recordedAt,
  }));
}

export async function ensureDefaultUsageMetrics(ownerId: string) {
  const businessId = await getCloudBusinessId(ownerId);
  const tenant = await prisma.platformCloudTenant.findUnique({ where: { businessId } });
  if (!tenant) return;

  const existing = await prisma.platformCloudUsageMetric.count({ where: { tenantId: tenant.id } });
  if (existing > 0) return;

  const samples = [
    { resource: "api_calls", value: 1240, limit: 10000 },
    { resource: "storage_gb", value: 2.4, limit: 50 },
    { resource: "active_users", value: 8, limit: 25 },
    { resource: "ai_tokens", value: 45000, limit: 100000 },
  ];

  for (const sample of samples) {
    await recordUsageMetric(ownerId, sample);
  }
}
