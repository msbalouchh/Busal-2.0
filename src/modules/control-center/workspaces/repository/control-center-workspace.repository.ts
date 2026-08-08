import "server-only";

import type { Prisma, TenantLifecycleStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { WORKSPACE_STATUSES, type WorkspaceStatus } from "@/modules/tenant/types/status";
import { CONTROL_CENTER_WORKSPACE_PAGE_SIZE } from "@/modules/control-center/workspaces/constants/control-center-workspaces";
import type { ControlCenterWorkspaceDirectoryQuery } from "@/modules/control-center/workspaces/types/control-center-workspaces-types";
import {
  buildOrganizationId,
  buildTenantIdFromBusiness,
  buildWorkspaceId,
} from "@/modules/control-center/workspaces/utils/workspace-ids";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function mapLifecycleToWorkspaceStatus(
  lifecycleStatus: TenantLifecycleStatus,
): WorkspaceStatus {
  switch (lifecycleStatus) {
    case "ACTIVE":
      return WORKSPACE_STATUSES.ACTIVE;
    case "PENDING":
      return WORKSPACE_STATUSES.PROVISIONING;
    case "SUSPENDED":
    case "ARCHIVED":
    case "DELETED":
      return WORKSPACE_STATUSES.ARCHIVED;
    default:
      return WORKSPACE_STATUSES.ACTIVE;
  }
}

function workspaceStatusToLifecycleStatuses(status: WorkspaceStatus): TenantLifecycleStatus[] {
  switch (status) {
    case WORKSPACE_STATUSES.ACTIVE:
      return ["ACTIVE"];
    case WORKSPACE_STATUSES.PROVISIONING:
      return ["PENDING"];
    case WORKSPACE_STATUSES.ARCHIVED:
      return ["SUSPENDED", "ARCHIVED", "DELETED"];
    default:
      return ["ACTIVE"];
  }
}

function buildDirectoryWhere(
  query: ControlCenterWorkspaceDirectoryQuery,
): Prisma.BusinessWhereInput {
  const where: Prisma.BusinessWhereInput = {};
  const tenantWhere: Prisma.TenantRecordWhereInput = {};

  if (query.lifecycleStatus) {
    tenantWhere.lifecycleStatus = query.lifecycleStatus;
  } else if (query.status) {
    tenantWhere.lifecycleStatus = { in: workspaceStatusToLifecycleStatuses(query.status) };
  }

  if (query.healthStatus) {
    tenantWhere.healthStatus = query.healthStatus;
  }

  if (query.subscriptionPlan) {
    tenantWhere.subscriptionPlan = { equals: query.subscriptionPlan, mode: "insensitive" };
  }

  if (Object.keys(tenantWhere).length > 0) {
    where.tenantRecord = tenantWhere;
  }

  if (query.country?.trim()) {
    where.country = { equals: query.country.trim(), mode: "insensitive" };
  }

  if (query.industry?.trim()) {
    where.industry = { contains: query.industry.trim(), mode: "insensitive" };
  }

  if (query.search?.trim()) {
    const search = query.search.trim();
    where.OR = [
      { businessName: { contains: search, mode: "insensitive" } },
      { businessCode: { contains: search, mode: "insensitive" } },
      { ownerName: { contains: search, mode: "insensitive" } },
      { owner: { email: { contains: search, mode: "insensitive" } } },
      { id: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

function buildDirectoryOrderBy(
  query: ControlCenterWorkspaceDirectoryQuery,
): Prisma.BusinessOrderByWithRelationInput {
  const direction = query.sortDirection ?? "desc";

  switch (query.sortBy) {
    case "workspaceName":
      return { businessName: direction };
    case "branchCount":
      return { tenantRecord: { branchCount: direction } };
    case "status":
      return { tenantRecord: { lifecycleStatus: direction } };
    case "lastActivity":
      return { updatedAt: direction };
    case "createdAt":
    default:
      return { createdAt: direction };
  }
}

export type WorkspaceBusinessRecord = Prisma.BusinessGetPayload<{
  include: {
    owner: { select: { email: true; fullName: true } };
    tenantRecord: {
      select: {
        lifecycleStatus: true;
        healthStatus: true;
        subscriptionPlan: true;
        subscriptionStatus: true;
        branchCount: true;
      };
    };
  };
}>;

export async function findWorkspaceBusinessRecords(
  query: ControlCenterWorkspaceDirectoryQuery = {},
): Promise<{ records: WorkspaceBusinessRecord[]; total: number }> {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? CONTROL_CENTER_WORKSPACE_PAGE_SIZE;
  const where = buildDirectoryWhere(query);
  const orderBy = buildDirectoryOrderBy(query);

  const [records, total] = await Promise.all([
    prisma.business.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        owner: { select: { email: true, fullName: true } },
        tenantRecord: {
          select: {
            lifecycleStatus: true,
            healthStatus: true,
            subscriptionPlan: true,
            subscriptionStatus: true,
            branchCount: true,
          },
        },
      },
    }),
    prisma.business.count({ where }),
  ]);

  return { records, total };
}

export async function findWorkspaceBusinessById(
  businessId: string,
): Promise<WorkspaceBusinessRecord | null> {
  return prisma.business.findUnique({
    where: { id: businessId },
    include: {
      owner: { select: { email: true, fullName: true } },
      tenantRecord: {
        select: {
          lifecycleStatus: true,
          healthStatus: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          branchCount: true,
        },
      },
    },
  });
}

export async function countWorkspaceStatistics(): Promise<{
  totalWorkspaces: number;
  activeWorkspaces: number;
  provisioningWorkspaces: number;
  archivedWorkspaces: number;
  totalBranches: number;
  totalUsers: number;
}> {
  const [totalWorkspaces, statusGroups, branchAggregate, memberCount, staffCount] =
    await Promise.all([
      prisma.business.count(),
      prisma.tenantRecord.groupBy({
        by: ["lifecycleStatus"],
        _count: { _all: true },
      }),
      prisma.tenantRecord.aggregate({ _sum: { branchCount: true } }),
      prisma.businessMember.count({ where: { status: "ACTIVE" } }),
      prisma.staff.count({ where: { isActive: true } }),
    ]);

  const statusMap = new Map(statusGroups.map((row) => [row.lifecycleStatus, row._count._all]));

  return {
    totalWorkspaces,
    activeWorkspaces: statusMap.get("ACTIVE") ?? 0,
    provisioningWorkspaces: statusMap.get("PENDING") ?? 0,
    archivedWorkspaces:
      (statusMap.get("SUSPENDED") ?? 0) +
      (statusMap.get("ARCHIVED") ?? 0) +
      (statusMap.get("DELETED") ?? 0),
    totalBranches: branchAggregate._sum.branchCount ?? 0,
    totalUsers: memberCount + staffCount,
  };
}

export async function loadWorkspaceUsageMap(
  businessIds: string[],
): Promise<Map<string, { aiTokensThisMonth: number; storageUsedBytes: bigint; activeUsers: number }>> {
  if (businessIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.tenantResourceUsage.findMany({
    where: { businessId: { in: businessIds } },
    select: {
      businessId: true,
      aiTokensThisMonth: true,
      storageUsedBytes: true,
      activeUsers: true,
    },
  });

  return new Map(rows.map((row) => [row.businessId, row]));
}

export async function loadWorkspaceActivityMap(
  businessIds: string[],
): Promise<Map<string, { lastActivity: Date | null; count: number }>> {
  if (businessIds.length === 0) {
    return new Map();
  }

  const [lastActivityRows, countRows] = await Promise.all([
    prisma.tenantActivityEvent.groupBy({
      by: ["businessId"],
      where: { businessId: { in: businessIds } },
      _max: { createdAt: true },
    }),
    prisma.tenantActivityEvent.groupBy({
      by: ["businessId"],
      where: { businessId: { in: businessIds } },
      _count: { _all: true },
    }),
  ]);

  const countMap = new Map(countRows.map((row) => [row.businessId, row._count._all]));

  return new Map(
    lastActivityRows.map((row) => [
      row.businessId,
      {
        lastActivity: row._max.createdAt,
        count: countMap.get(row.businessId) ?? 0,
      },
    ]),
  );
}

export async function loadWorkspaceMemberCounts(
  businessIds: string[],
): Promise<Map<string, number>> {
  if (businessIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.businessMember.groupBy({
    by: ["businessId"],
    where: { businessId: { in: businessIds }, status: "ACTIVE" },
    _count: { _all: true },
  });

  return new Map(rows.map((row) => [row.businessId, row._count._all]));
}

export function mapBusinessRecordToWorkspaceIds(businessId: string) {
  return {
    workspaceId: buildWorkspaceId(businessId),
    tenantId: buildTenantIdFromBusiness(businessId),
    organizationId: buildOrganizationId(businessId),
    businessId,
  };
}

export function mapBusinessRecordToSlug(businessName: string | null, businessId: string): string {
  return slugify(businessName ?? businessId);
}
