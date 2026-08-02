import "server-only";

import { prisma } from "@/lib/prisma";
import { generateLicenseKey, getCloudBusinessId } from "@/services/cloud-platform-context.service";

export async function validateTenantLicense(ownerId: string): Promise<{
  valid: boolean;
  licenseKey: string;
  planSlug: string | null;
  reason?: string;
}> {
  const businessId = await getCloudBusinessId(ownerId);
  const tenant = await prisma.platformCloudTenant.findUnique({
    where: { businessId },
    include: { plan: true },
  });

  if (!tenant)
    return { valid: false, licenseKey: "", planSlug: null, reason: "Tenant not provisioned" };
  if (tenant.status === "SUSPENDED" || tenant.status === "CANCELLED") {
    return {
      valid: false,
      licenseKey: "",
      planSlug: tenant.plan?.slug ?? null,
      reason: `Tenant status is ${tenant.status}`,
    };
  }

  const licenseKey = generateLicenseKey(tenant.tenantKey, tenant.plan?.slug ?? "none");
  return { valid: true, licenseKey, planSlug: tenant.plan?.slug ?? null };
}

export async function getLicenseInfo(ownerId: string) {
  const validation = await validateTenantLicense(ownerId);
  const businessId = await getCloudBusinessId(ownerId);
  const subscription = await prisma.platformCloudTenantSubscription.findFirst({
    where: { tenant: { businessId }, status: { in: ["TRIAL", "ACTIVE"] } },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    ...validation,
    subscriptionStatus: subscription?.status ?? null,
    expiresAt: subscription?.expiresAt?.toISOString() ?? null,
  };
}
