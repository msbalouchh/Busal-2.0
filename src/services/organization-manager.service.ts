import "server-only";

import type { PlatformEnterpriseOrganizationStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getEnterpriseTenantId } from "@/services/enterprise-platform-context.service";
import { writeEnterpriseAuditLog } from "@/services/enterprise-audit.service";

export async function createOrganization(
  ownerId: string,
  input: {
    name: string;
    slug: string;
    industry?: string;
    settings?: Record<string, unknown>;
  },
) {
  const tenantId = await getEnterpriseTenantId(ownerId);
  const org = await prisma.platformEnterpriseOrganization.create({
    data: {
      tenantId,
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase(),
      industry: input.industry?.trim() ?? "",
      settings: (input.settings ?? {}) as Prisma.InputJsonValue,
    },
  });

  await writeEnterpriseAuditLog(ownerId, {
    organizationId: org.id,
    action: "organization.created",
    entityType: "organization",
    entityId: org.id,
    message: `Organization ${org.name} created`,
  });

  return org;
}

export async function listOrganizations(
  ownerId: string,
  filters?: { status?: PlatformEnterpriseOrganizationStatus; search?: string },
) {
  const tenantId = await getEnterpriseTenantId(ownerId);
  return prisma.platformEnterpriseOrganization.findMany({
    where: {
      tenantId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { slug: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { units: true, identityProviders: true, policies: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getOrganization(ownerId: string, organizationId: string) {
  const tenantId = await getEnterpriseTenantId(ownerId);
  return prisma.platformEnterpriseOrganization.findFirst({
    where: { id: organizationId, tenantId },
    include: {
      units: { orderBy: { name: "asc" } },
      identityProviders: { orderBy: { name: "asc" } },
      policies: { orderBy: { name: "asc" } },
    },
  });
}

export async function updateOrganizationSettings(
  ownerId: string,
  organizationId: string,
  settings: Record<string, unknown>,
) {
  const tenantId = await getEnterpriseTenantId(ownerId);
  const org = await prisma.platformEnterpriseOrganization.findFirst({
    where: { id: organizationId, tenantId },
  });
  if (!org) return null;

  return prisma.platformEnterpriseOrganization.update({
    where: { id: organizationId },
    data: { settings: settings as Prisma.InputJsonValue },
  });
}

export async function getOrganizationsSummary(ownerId: string) {
  const tenantId = await getEnterpriseTenantId(ownerId);
  const [total, active, suspended] = await Promise.all([
    prisma.platformEnterpriseOrganization.count({ where: { tenantId } }),
    prisma.platformEnterpriseOrganization.count({ where: { tenantId, status: "ACTIVE" } }),
    prisma.platformEnterpriseOrganization.count({ where: { tenantId, status: "SUSPENDED" } }),
  ]);
  return { total, active, suspended };
}

export async function ensureDefaultOrganization(ownerId: string) {
  const tenantId = await getEnterpriseTenantId(ownerId);
  const existing = await prisma.platformEnterpriseOrganization.count({ where: { tenantId } });
  if (existing > 0) return;

  const org = await createOrganization(ownerId, {
    name: "Primary Organization",
    slug: "primary",
    industry: "enterprise",
    settings: { default: true },
  });

  const { createOrganizationUnit } = await import("@/services/organization-hierarchy.service");
  await createOrganizationUnit(ownerId, org.id, {
    name: "Headquarters",
    type: "business_unit",
  });
  await createOrganizationUnit(ownerId, org.id, {
    name: "Engineering",
    type: "department",
  });
}
