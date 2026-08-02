import "server-only";

import type {
  PlatformEnterpriseIdentityProviderType,
  PlatformEnterpriseProviderStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  getEnterpriseTenantId,
  validateProviderConfiguration,
} from "@/services/enterprise-platform-context.service";
import { writeEnterpriseAuditLog } from "@/services/enterprise-audit.service";

async function assertOrganizationAccess(ownerId: string, organizationId: string) {
  const tenantId = await getEnterpriseTenantId(ownerId);
  return prisma.platformEnterpriseOrganization.findFirst({
    where: { id: organizationId, tenantId },
  });
}

export async function createIdentityProvider(
  ownerId: string,
  input: {
    organizationId: string;
    name: string;
    providerType: PlatformEnterpriseIdentityProviderType;
    configuration?: Record<string, unknown>;
  },
) {
  const org = await assertOrganizationAccess(ownerId, input.organizationId);
  if (!org) return null;

  const config = input.configuration ?? { framework: input.providerType.toLowerCase() };
  const validation = validateProviderConfiguration(input.providerType, config);
  if (!validation.valid) throw new Error(validation.reason ?? "Invalid provider configuration");

  const provider = await prisma.platformEnterpriseIdentityProvider.create({
    data: {
      organizationId: input.organizationId,
      name: input.name.trim(),
      providerType: input.providerType,
      configuration: config as Prisma.InputJsonValue,
      status: "PENDING",
    },
  });

  await writeEnterpriseAuditLog(ownerId, {
    organizationId: input.organizationId,
    action: "identity_provider.created",
    entityType: "identity_provider",
    entityId: provider.id,
    message: `Identity provider ${provider.name} configured (${provider.providerType})`,
  });

  return provider;
}

export async function listIdentityProviders(ownerId: string, organizationId?: string) {
  const tenantId = await getEnterpriseTenantId(ownerId);
  return prisma.platformEnterpriseIdentityProvider.findMany({
    where: {
      organization: { tenantId },
      ...(organizationId ? { organizationId } : {}),
    },
    include: { organization: { select: { name: true, slug: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function updateIdentityProviderStatus(
  ownerId: string,
  providerId: string,
  status: PlatformEnterpriseProviderStatus,
) {
  const tenantId = await getEnterpriseTenantId(ownerId);
  const provider = await prisma.platformEnterpriseIdentityProvider.findFirst({
    where: { id: providerId, organization: { tenantId } },
  });
  if (!provider) return null;

  return prisma.platformEnterpriseIdentityProvider.update({
    where: { id: providerId },
    data: { status },
  });
}

export function getProviderFramework(providerType: string): string {
  const map: Record<string, string> = {
    SAML: "saml",
    OIDC: "oidc",
    LDAP: "ldap",
    AZURE_AD: "oidc",
    GOOGLE: "oidc",
    OKTA: "saml",
    AUTH0: "oidc",
    CUSTOM: "sso",
  };
  return map[providerType] ?? "sso";
}

export async function ensureDefaultIdentityProviders(ownerId: string) {
  const orgs = await listIdentityProviders(ownerId);
  if (orgs.length > 0) return;

  const { listOrganizations } = await import("@/services/organization-manager.service");
  const organizations = await listOrganizations(ownerId);
  const primary = organizations[0];
  if (!primary) return;

  await createIdentityProvider(ownerId, {
    organizationId: primary.id,
    name: "Enterprise SSO (Framework)",
    providerType: "SAML",
    configuration: { framework: "saml", entityId: "virtual://enterprise/sso", simulated: true },
  });
  await createIdentityProvider(ownerId, {
    organizationId: primary.id,
    name: "OIDC Provider (Framework)",
    providerType: "OIDC",
    configuration: { framework: "oidc", clientId: "virtual-client", simulated: true },
  });
}
