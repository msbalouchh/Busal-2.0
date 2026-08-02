import "server-only";

import type { PlatformEnterprisePolicyCategory, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  getEnterpriseTenantId,
  validatePolicyConfiguration,
} from "@/services/enterprise-platform-context.service";
import { writeEnterpriseAuditLog } from "@/services/enterprise-audit.service";

async function assertOrganizationAccess(ownerId: string, organizationId: string) {
  const tenantId = await getEnterpriseTenantId(ownerId);
  return prisma.platformEnterpriseOrganization.findFirst({
    where: { id: organizationId, tenantId },
  });
}

export async function createEnterprisePolicy(
  ownerId: string,
  input: {
    organizationId: string;
    name: string;
    category: PlatformEnterprisePolicyCategory;
    configuration?: Record<string, unknown>;
    enabled?: boolean;
  },
) {
  const org = await assertOrganizationAccess(ownerId, input.organizationId);
  if (!org) return null;

  const config = input.configuration ?? {};
  const validation = validatePolicyConfiguration(input.category, config);
  if (!validation.valid) throw new Error(validation.reason ?? "Invalid policy configuration");

  const policy = await prisma.platformEnterprisePolicy.create({
    data: {
      organizationId: input.organizationId,
      name: input.name.trim(),
      category: input.category,
      configuration: config as Prisma.InputJsonValue,
      enabled: input.enabled ?? true,
    },
  });

  await writeEnterpriseAuditLog(ownerId, {
    organizationId: input.organizationId,
    action: "policy.created",
    entityType: "policy",
    entityId: policy.id,
    message: `Policy ${policy.name} created (${policy.category})`,
  });

  return policy;
}

export async function listEnterprisePolicies(
  ownerId: string,
  filters?: { organizationId?: string; category?: PlatformEnterprisePolicyCategory },
) {
  const tenantId = await getEnterpriseTenantId(ownerId);
  return prisma.platformEnterprisePolicy.findMany({
    where: {
      organization: { tenantId },
      ...(filters?.organizationId ? { organizationId: filters.organizationId } : {}),
      ...(filters?.category ? { category: filters.category } : {}),
    },
    include: { organization: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function toggleEnterprisePolicy(ownerId: string, policyId: string, enabled: boolean) {
  const tenantId = await getEnterpriseTenantId(ownerId);
  const policy = await prisma.platformEnterprisePolicy.findFirst({
    where: { id: policyId, organization: { tenantId } },
  });
  if (!policy) return null;

  return prisma.platformEnterprisePolicy.update({
    where: { id: policyId },
    data: { enabled },
  });
}

export async function ensureDefaultPolicies(ownerId: string) {
  const existing = await listEnterprisePolicies(ownerId);
  if (existing.length > 0) return;

  const { listOrganizations } = await import("@/services/organization-manager.service");
  const organizations = await listOrganizations(ownerId);
  const primary = organizations[0];
  if (!primary) return;

  await createEnterprisePolicy(ownerId, {
    organizationId: primary.id,
    name: "Session timeout",
    category: "SESSION",
    configuration: { maxSessionMinutes: 480, enforceMfa: false },
  });
  await createEnterprisePolicy(ownerId, {
    organizationId: primary.id,
    name: "Password requirements",
    category: "PASSWORD",
    configuration: { minLength: 12, requireSymbols: true },
  });
  await createEnterprisePolicy(ownerId, {
    organizationId: primary.id,
    name: "Device compliance",
    category: "DEVICE",
    configuration: { requireManagedDevice: false, allowedPlatforms: ["web", "mobile"] },
  });
  await createEnterprisePolicy(ownerId, {
    organizationId: primary.id,
    name: "SOC2 compliance baseline",
    category: "COMPLIANCE",
    configuration: { framework: "soc2", auditRetentionDays: 365 },
  });
}
