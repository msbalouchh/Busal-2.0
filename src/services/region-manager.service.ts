import "server-only";

import { CLOUD_REGIONS, getCloudBusinessId } from "@/services/cloud-platform-context.service";
import { prisma } from "@/lib/prisma";

export async function getTenantRegion(ownerId: string): Promise<string | null> {
  const businessId = await getCloudBusinessId(ownerId);
  const tenant = await prisma.platformCloudTenant.findUnique({
    where: { businessId },
    select: { region: true },
  });
  return tenant?.region ?? null;
}

export async function updateTenantRegion(ownerId: string, region: string) {
  if (!CLOUD_REGIONS.includes(region as (typeof CLOUD_REGIONS)[number])) {
    throw new Error("Invalid region");
  }
  const businessId = await getCloudBusinessId(ownerId);
  const tenant = await prisma.platformCloudTenant.findUnique({ where: { businessId } });
  if (!tenant) return null;

  return prisma.platformCloudTenant.update({
    where: { id: tenant.id },
    data: { region },
  });
}

export function listAvailableRegions(): Array<{ id: string; label: string }> {
  return CLOUD_REGIONS.map((region) => ({
    id: region,
    label: region.replace(/-/g, " ").toUpperCase(),
  }));
}
