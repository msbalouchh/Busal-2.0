import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getEnterpriseTenantId } from "@/services/enterprise-platform-context.service";

export async function writeEnterpriseAuditLog(
  ownerId: string,
  input: {
    organizationId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    message?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const tenantId = await getEnterpriseTenantId(ownerId);
  return prisma.platformEnterpriseAuditLog.create({
    data: {
      tenantId,
      organizationId: input.organizationId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      message: input.message ?? "",
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function listEnterpriseAuditLogs(
  ownerId: string,
  filters?: { organizationId?: string; limit?: number },
) {
  const tenantId = await getEnterpriseTenantId(ownerId);
  return prisma.platformEnterpriseAuditLog.findMany({
    where: {
      tenantId,
      ...(filters?.organizationId ? { organizationId: filters.organizationId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: filters?.limit ?? 50,
  });
}

export async function getEnterpriseAuditSummary(ownerId: string) {
  const tenantId = await getEnterpriseTenantId(ownerId);
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [total7d, byAction] = await Promise.all([
    prisma.platformEnterpriseAuditLog.count({ where: { tenantId, createdAt: { gte: since } } }),
    prisma.platformEnterpriseAuditLog.groupBy({
      by: ["action"],
      where: { tenantId, createdAt: { gte: since } },
      _count: { id: true },
    }),
  ]);

  return {
    total7d,
    byAction: byAction.map((row) => ({ action: row.action, count: row._count.id })),
  };
}
