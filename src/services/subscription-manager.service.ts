import "server-only";

import type { PlatformCloudSubscriptionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { TRIAL_DURATION_DAYS } from "@/modules/billing/constants/billing-status";
import { getCloudBusinessId } from "@/services/cloud-platform-context.service";

export async function createTenantSubscription(
  ownerId: string,
  input: { planId: string; status?: PlatformCloudSubscriptionStatus },
) {
  const businessId = await getCloudBusinessId(ownerId);
  const tenant = await prisma.platformCloudTenant.findUnique({ where: { businessId } });
  if (!tenant) return null;

  const trialEnds = new Date(Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const subscription = await prisma.platformCloudTenantSubscription.create({
    data: {
      tenantId: tenant.id,
      planId: input.planId,
      status: input.status ?? "TRIAL",
      expiresAt: input.status === "TRIAL" ? trialEnds : null,
      renewalDate: input.status === "ACTIVE" ? trialEnds : null,
    },
    include: { plan: true },
  });

  await prisma.platformCloudTenant.update({
    where: { id: tenant.id },
    data: { subscriptionId: subscription.id, planId: input.planId },
  });

  return subscription;
}

export async function listTenantSubscriptions(ownerId: string) {
  const businessId = await getCloudBusinessId(ownerId);
  return prisma.platformCloudTenantSubscription.findMany({
    where: { tenant: { businessId } },
    include: { plan: true, tenant: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateSubscriptionStatus(
  ownerId: string,
  subscriptionId: string,
  status: PlatformCloudSubscriptionStatus,
) {
  const businessId = await getCloudBusinessId(ownerId);
  const subscription = await prisma.platformCloudTenantSubscription.findFirst({
    where: { id: subscriptionId, tenant: { businessId } },
  });
  if (!subscription) return null;

  return prisma.platformCloudTenantSubscription.update({
    where: { id: subscriptionId },
    data: {
      status,
      renewalDate: status === "ACTIVE" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
    },
    include: { plan: true },
  });
}

export async function getActiveSubscription(ownerId: string) {
  const businessId = await getCloudBusinessId(ownerId);
  return prisma.platformCloudTenantSubscription.findFirst({
    where: {
      tenant: { businessId },
      status: { in: ["TRIAL", "ACTIVE"] },
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
}
