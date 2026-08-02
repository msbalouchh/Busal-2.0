import "server-only";

import { prisma } from "@/lib/prisma";
import { getEnterpriseTenantId } from "@/services/enterprise-platform-context.service";

export interface DirectorySyncJob {
  id: string;
  organizationId: string;
  status: "pending" | "simulated" | "completed";
  providerType: string;
  lastSyncAt: Date | null;
}

export async function createDirectorySyncJob(
  ownerId: string,
  organizationId: string,
  providerType: string,
): Promise<DirectorySyncJob> {
  const tenantId = await getEnterpriseTenantId(ownerId);
  const org = await prisma.platformEnterpriseOrganization.findFirst({
    where: { id: organizationId, tenantId },
  });
  if (!org) throw new Error("Organization not found");

  return {
    id: `sync-${organizationId}-${Date.now()}`,
    organizationId,
    status: "simulated",
    providerType,
    lastSyncAt: new Date(),
  };
}

export async function listDirectorySyncStatus(ownerId: string): Promise<DirectorySyncJob[]> {
  const tenantId = await getEnterpriseTenantId(ownerId);
  const providers = await prisma.platformEnterpriseIdentityProvider.findMany({
    where: { organization: { tenantId }, status: "ACTIVE" },
    select: { organizationId: true, providerType: true, updatedAt: true },
  });

  return providers.map((provider, index) => ({
    id: `sync-${provider.organizationId}-${index}`,
    organizationId: provider.organizationId,
    status: "simulated" as const,
    providerType: provider.providerType,
    lastSyncAt: provider.updatedAt,
  }));
}

export function getDirectorySyncFramework(providerType: string): {
  supported: boolean;
  protocol: string;
  simulated: boolean;
} {
  const scimTypes = ["OKTA", "AZURE_AD", "AUTH0"];
  const ldapTypes = ["LDAP"];
  if (scimTypes.includes(providerType)) {
    return { supported: true, protocol: "scim", simulated: true };
  }
  if (ldapTypes.includes(providerType)) {
    return { supported: true, protocol: "ldap", simulated: true };
  }
  return { supported: false, protocol: "none", simulated: true };
}
