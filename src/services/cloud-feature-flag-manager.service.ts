import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  CLOUD_FEATURE_FLAG_KEYS,
  getCloudBusinessId,
} from "@/services/cloud-platform-context.service";

export async function seedDefaultFeatureFlags(ownerId: string) {
  const businessId = await getCloudBusinessId(ownerId);
  const tenant = await prisma.platformCloudTenant.findUnique({ where: { businessId } });
  if (!tenant) return;

  const existing = await prisma.platformCloudTenantFeatureFlag.count({
    where: { tenantId: tenant.id },
  });
  if (existing > 0) return;

  const enabledByDefault = new Set(["restaurant_module", "crm", "documents"]);

  for (const key of CLOUD_FEATURE_FLAG_KEYS) {
    await prisma.platformCloudTenantFeatureFlag.create({
      data: {
        tenantId: tenant.id,
        key,
        enabled: enabledByDefault.has(key),
        configuration: { source: "cloud-platform" } as Prisma.InputJsonValue,
      },
    });
  }
}

export async function listTenantFeatureFlags(ownerId: string) {
  const businessId = await getCloudBusinessId(ownerId);
  return prisma.platformCloudTenantFeatureFlag.findMany({
    where: { tenant: { businessId } },
    orderBy: { key: "asc" },
  });
}

export async function toggleTenantFeatureFlag(ownerId: string, flagId: string, enabled: boolean) {
  const businessId = await getCloudBusinessId(ownerId);
  const flag = await prisma.platformCloudTenantFeatureFlag.findFirst({
    where: { id: flagId, tenant: { businessId } },
  });
  if (!flag) return null;

  return prisma.platformCloudTenantFeatureFlag.update({
    where: { id: flagId },
    data: { enabled },
  });
}

export async function isFeatureEnabled(ownerId: string, key: string): Promise<boolean> {
  const businessId = await getCloudBusinessId(ownerId);
  const flag = await prisma.platformCloudTenantFeatureFlag.findFirst({
    where: { tenant: { businessId }, key },
  });
  return flag?.enabled ?? false;
}
