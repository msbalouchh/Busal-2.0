import "server-only";

import { prisma } from "@/lib/prisma";
import { getEnterpriseTenantId } from "@/services/enterprise-platform-context.service";
import { writeEnterpriseAuditLog } from "@/services/enterprise-audit.service";

export async function createOrganizationUnit(
  ownerId: string,
  organizationId: string,
  input: { name: string; type?: string; parentId?: string },
) {
  const tenantId = await getEnterpriseTenantId(ownerId);
  const org = await prisma.platformEnterpriseOrganization.findFirst({
    where: { id: organizationId, tenantId },
  });
  if (!org) return null;

  const unit = await prisma.platformEnterpriseOrganizationUnit.create({
    data: {
      organizationId,
      name: input.name.trim(),
      type: input.type ?? "department",
      parentId: input.parentId,
    },
  });

  await writeEnterpriseAuditLog(ownerId, {
    organizationId,
    action: "organization_unit.created",
    entityType: "organization_unit",
    entityId: unit.id,
    message: `Unit ${unit.name} created`,
  });

  return unit;
}

export async function listOrganizationUnits(ownerId: string, organizationId: string) {
  const tenantId = await getEnterpriseTenantId(ownerId);
  const org = await prisma.platformEnterpriseOrganization.findFirst({
    where: { id: organizationId, tenantId },
  });
  if (!org) return [];

  return prisma.platformEnterpriseOrganizationUnit.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
  });
}

export async function getOrganizationHierarchy(ownerId: string, organizationId: string) {
  const units = await listOrganizationUnits(ownerId, organizationId);
  const roots = units.filter((unit) => !unit.parentId);
  const childrenMap = new Map<string, typeof units>();

  for (const unit of units) {
    if (!unit.parentId) continue;
    const siblings = childrenMap.get(unit.parentId) ?? [];
    siblings.push(unit);
    childrenMap.set(unit.parentId, siblings);
  }

  return roots.map((root) => ({
    ...root,
    children: childrenMap.get(root.id) ?? [],
  }));
}

export async function listAllDepartments(ownerId: string) {
  const tenantId = await getEnterpriseTenantId(ownerId);
  return prisma.platformEnterpriseOrganizationUnit.findMany({
    where: {
      organization: { tenantId },
      type: { in: ["department", "team"] },
    },
    include: { organization: { select: { name: true, slug: true } } },
    orderBy: { name: "asc" },
  });
}
