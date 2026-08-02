import "server-only";

import type { PlatformCloudTenantStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getCloudBusinessId } from "@/services/cloud-platform-context.service";

export async function provisionTenant(
  ownerId: string,
  input?: { region?: string; planSlug?: string },
) {
  const businessId = await getCloudBusinessId(ownerId);
  const existing = await prisma.platformCloudTenant.findUnique({ where: { businessId } });
  if (existing) return existing;

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  const tenantKey = business?.businessCode ?? `tenant-${businessId.slice(0, 8)}`;

  const plan = input?.planSlug
    ? await prisma.platformCloudSubscriptionPlan.findFirst({ where: { slug: input.planSlug } })
    : await prisma.platformCloudSubscriptionPlan.findFirst({ where: { slug: "starter" } });

  const tenant = await prisma.platformCloudTenant.create({
    data: {
      businessId,
      tenantKey,
      status: "TRIAL",
      planId: plan?.id,
      region: input?.region ?? "eu-west-1",
    },
  });

  if (plan) {
    const { createTenantSubscription } = await import("@/services/subscription-manager.service");
    await createTenantSubscription(ownerId, { planId: plan.id, status: "TRIAL" });
  }

  const { seedDefaultFeatureFlags } = await import("@/services/cloud-feature-flag-manager.service");
  await seedDefaultFeatureFlags(ownerId);

  return tenant;
}

export async function getCloudTenant(ownerId: string) {
  const businessId = await getCloudBusinessId(ownerId);
  return prisma.platformCloudTenant.findUnique({
    where: { businessId },
    include: {
      plan: true,
      featureFlags: true,
      usageMetrics: { take: 10, orderBy: { recordedAt: "desc" } },
    },
  });
}

export async function listCloudTenants(ownerId: string) {
  const businessId = await getCloudBusinessId(ownerId);
  return prisma.platformCloudTenant.findMany({
    where: { businessId },
    include: { plan: true },
  });
}

export async function updateTenantStatus(
  ownerId: string,
  tenantId: string,
  status: PlatformCloudTenantStatus,
) {
  const businessId = await getCloudBusinessId(ownerId);
  const tenant = await prisma.platformCloudTenant.findFirst({
    where: { id: tenantId, businessId },
  });
  if (!tenant) return null;
  return prisma.platformCloudTenant.update({ where: { id: tenantId }, data: { status } });
}

export async function getTenantHealth(ownerId: string) {
  const tenant = await getCloudTenant(ownerId);
  if (!tenant) return { status: "unknown" as const, healthy: false };

  const usageOverLimit = tenant.usageMetrics.some((m) => m.limit > 0 && m.value >= m.limit);
  const healthy = tenant.status === "ACTIVE" || tenant.status === "TRIAL" ? !usageOverLimit : false;

  return {
    status: tenant.status,
    healthy,
    region: tenant.region,
    usageOverLimit,
  };
}
