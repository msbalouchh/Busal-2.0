import "server-only";

import type { Prisma, TenantLifecycleStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import { getPlanMrrPence } from "@/modules/control-center/billing/registry/subscription-plan-registry";
import { buildOperatorTenantPlatformContext } from "@/modules/control-center/tenants/lib/build-operator-tenant-context";
import { CONTROL_CENTER_WORKSPACE_PAGE_SIZE } from "@/modules/control-center/workspaces/constants/control-center-workspaces";
import {
  findWorkspaceBusinessById,
  findWorkspaceBusinessRecords,
  countWorkspaceStatistics,
  loadWorkspaceActivityMap,
  loadWorkspaceMemberCounts,
  loadWorkspaceUsageMap,
  mapBusinessRecordToSlug,
  mapBusinessRecordToWorkspaceIds,
  mapLifecycleToWorkspaceStatus,
  type WorkspaceBusinessRecord,
} from "@/modules/control-center/workspaces/repository/control-center-workspace.repository";
import type {
  ControlCenterWorkspaceBulkActionInput,
  ControlCenterWorkspaceBulkActionResult,
  ControlCenterWorkspaceDetailBundle,
  ControlCenterWorkspaceDirectoryItem,
  ControlCenterWorkspaceDirectoryQuery,
  ControlCenterWorkspaceDirectoryResult,
  ControlCenterWorkspaceManagementBundle,
  ControlCenterWorkspacePermissions,
  ControlCenterWorkspaceProfile,
  ControlCenterWorkspaceStatistics,
  TransferControlCenterWorkspaceOwnershipInput,
  UpdateControlCenterWorkspaceInput,
} from "@/modules/control-center/workspaces/types/control-center-workspaces-types";
import { resolveBusinessIdFromWorkspaceId } from "@/modules/control-center/workspaces/utils/workspace-ids";
import type { ControlCenterOperatorContext } from "@/modules/control-center/types/control-center-types";
import { tenantFoundationService } from "@/modules/tenant/services/tenant-foundation.service";
import {
  serializeTenantActivity,
  serializeTenantAuditLog,
} from "@/modules/tenant-platform/utils/tenant-platform-utils";
import {
  activateTenant,
  archiveTenant,
  ensureTenantPlatformDefaults,
  listTenantActivityEvents,
  listTenantPlatformAuditLogs,
  runTenantHealthCheck,
  suspendTenant,
} from "@/services/tenant-platform.service";

function buildPermissions(
  operator: ControlCenterOperatorContext,
): ControlCenterWorkspacePermissions {
  const permissions = new Set(operator.permissions);
  const hasAdmin = permissions.has(PERMISSION_CODES.CONTROL_CENTER_ADMIN);

  return {
    canView:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_WORKSPACES) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_VIEW),
    canEdit:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_WORKSPACES_EDIT) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_WORKSPACES),
    canSuspend:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_WORKSPACES_SUSPEND) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_WORKSPACES),
    canDelete:
      hasAdmin || hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_WORKSPACES_DELETE),
    canTransfer:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_WORKSPACES_TRANSFER) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_WORKSPACES_EDIT),
    canExport:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_WORKSPACES) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_VIEW),
  };
}

function mapDirectoryItem(
  record: WorkspaceBusinessRecord,
  userCount: number,
  usage: { aiTokensThisMonth: number; storageUsedBytes: bigint; activeUsers: number } | null,
  activity: { lastActivity: Date | null; count: number } | null,
): ControlCenterWorkspaceDirectoryItem {
  const ids = mapBusinessRecordToWorkspaceIds(record.id);
  const tenant = record.tenantRecord;
  const lifecycleStatus = tenant?.lifecycleStatus ?? "PENDING";
  const workspaceName = record.businessName ?? "Untitled workspace";

  return {
    id: ids.workspaceId,
    workspaceId: ids.workspaceId,
    businessId: ids.businessId,
    tenantId: ids.tenantId,
    organizationId: ids.organizationId,
    workspaceName,
    businessName: workspaceName,
    slug: mapBusinessRecordToSlug(record.businessName, record.id),
    industry: record.industry,
    country: record.country,
    ownerName: record.ownerName,
    ownerEmail: record.owner.email,
    status: mapLifecycleToWorkspaceStatus(lifecycleStatus),
    lifecycleStatus,
    healthStatus: tenant?.healthStatus ?? "HEALTHY",
    branchCount: tenant?.branchCount ?? 0,
    userCount,
    businessCount: 1,
    subscriptionPlan: tenant?.subscriptionPlan ?? null,
    subscriptionStatus: tenant?.subscriptionStatus ?? "ACTIVE",
    mrrPence: getPlanMrrPence(tenant?.subscriptionPlan),
    aiTokensThisMonth: usage?.aiTokensThisMonth ?? 0,
    storageUsedBytes: (usage?.storageUsedBytes ?? BigInt(0)).toString(),
    activityCount: activity?.count ?? 0,
    lastActivityAt: activity?.lastActivity?.toISOString() ?? record.updatedAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
  };
}

async function buildStatistics(): Promise<ControlCenterWorkspaceStatistics> {
  const [stats, tenantRecords] = await Promise.all([
    countWorkspaceStatistics(),
    prisma.tenantRecord.findMany({
      select: { subscriptionPlan: true, subscriptionStatus: true },
    }),
  ]);

  const mrrPence = tenantRecords.reduce(
    (sum, record) =>
      record.subscriptionStatus === "ACTIVE" || record.subscriptionStatus === "TRIAL"
        ? sum + getPlanMrrPence(record.subscriptionPlan)
        : sum,
    0,
  );

  return {
    totalWorkspaces: stats.totalWorkspaces,
    activeWorkspaces: stats.activeWorkspaces,
    provisioningWorkspaces: stats.provisioningWorkspaces,
    archivedWorkspaces: stats.archivedWorkspaces,
    totalBusinesses: stats.totalWorkspaces,
    totalBranches: stats.totalBranches,
    totalUsers: stats.totalUsers,
    totalMrrPence: mrrPence,
  };
}

export async function queryControlCenterWorkspaceDirectory(
  query: ControlCenterWorkspaceDirectoryQuery = {},
): Promise<ControlCenterWorkspaceDirectoryResult> {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? CONTROL_CENTER_WORKSPACE_PAGE_SIZE;

  const [{ records, total }, statistics] = await Promise.all([
    findWorkspaceBusinessRecords(query),
    buildStatistics(),
  ]);

  const businessIds = records.map((record) => record.id);
  const [usageMap, activityMap, memberMap] = await Promise.all([
    loadWorkspaceUsageMap(businessIds),
    loadWorkspaceActivityMap(businessIds),
    loadWorkspaceMemberCounts(businessIds),
  ]);

  let items = records.map((record) =>
    mapDirectoryItem(
      record,
      (memberMap.get(record.id) ?? 0) + (usageMap.get(record.id)?.activeUsers ?? 0),
      usageMap.get(record.id) ?? null,
      activityMap.get(record.id) ?? null,
    ),
  );

  if (query.sortBy === "userCount") {
    const direction = query.sortDirection === "asc" ? 1 : -1;
    items = [...items].sort((a, b) => (a.userCount - b.userCount) * direction);
  }

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
    statistics,
  };
}

export async function getControlCenterWorkspaceManagementBundle(
  operator: ControlCenterOperatorContext,
  query: ControlCenterWorkspaceDirectoryQuery = {},
): Promise<ControlCenterWorkspaceManagementBundle> {
  const permissions = buildPermissions(operator);

  if (!permissions.canView) {
    throw new Error("Permission denied");
  }

  const directory = await queryControlCenterWorkspaceDirectory(query);

  return { directory, permissions };
}

export async function getControlCenterWorkspaceDetailBundle(
  operator: ControlCenterOperatorContext,
  workspaceId: string,
): Promise<ControlCenterWorkspaceDetailBundle> {
  const permissions = buildPermissions(operator);

  if (!permissions.canView) {
    throw new Error("Permission denied");
  }

  const businessId = resolveBusinessIdFromWorkspaceId(workspaceId);
  await ensureTenantPlatformDefaults(businessId);
  const platform = await buildOperatorTenantPlatformContext(operator, businessId);

  const business = await findWorkspaceBusinessById(businessId);

  if (!business) {
    throw new Error("Workspace not found");
  }

  const [
    tenantRecord,
    usage,
    limits,
    branches,
    members,
    staffRows,
    activities,
    auditLogs,
    health,
    lastActivityEvent,
    owner,
  ] = await Promise.all([
    prisma.tenantRecord.findUnique({ where: { businessId } }),
    prisma.tenantResourceUsage.findUnique({ where: { businessId } }),
    prisma.tenantResourceLimit.findUnique({ where: { businessId } }),
    prisma.branch.findMany({
      where: { businessId },
      orderBy: [{ isMain: "desc" }, { name: "asc" }],
      include: { _count: { select: { staff: true } } },
    }),
    prisma.businessMember.findMany({
      where: { businessId },
      include: { user: { select: { id: true, email: true, fullName: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.staff.findMany({
      where: { businessId, isActive: true },
      take: 50,
      select: { id: true, fullName: true, email: true, jobTitle: true, isActive: true },
    }),
    listTenantActivityEvents(businessId),
    listTenantPlatformAuditLogs(businessId),
    runTenantHealthCheck(platform),
    prisma.tenantActivityEvent.findFirst({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.user.findUnique({
      where: { id: business.ownerId },
      select: { id: true, email: true, fullName: true },
    }),
  ]);

  if (!owner) {
    throw new Error("Workspace owner not found");
  }

  const ids = mapBusinessRecordToWorkspaceIds(businessId);
  const lifecycleStatus = tenantRecord?.lifecycleStatus ?? "PENDING";
  const workspaceName = business.businessName ?? "Untitled workspace";

  const users = [
    ...members.map((member) => ({
      id: member.id,
      fullName: member.user.fullName ?? member.user.email,
      email: member.user.email,
      role: member.role,
      status: member.status,
    })),
    ...staffRows
      .filter((staff) => !members.some((member) => member.user.email === staff.email))
      .map((staff) => ({
        id: staff.id,
        fullName: staff.fullName,
        email: staff.email ?? "",
        role: staff.jobTitle ?? "Staff",
        status: staff.isActive ? "ACTIVE" : "INACTIVE",
      })),
  ];

  const profile: ControlCenterWorkspaceProfile = {
    workspaceId: ids.workspaceId,
    businessId: ids.businessId,
    tenantId: ids.tenantId,
    organizationId: ids.organizationId,
    workspaceName,
    slug: mapBusinessRecordToSlug(business.businessName, businessId),
    industry: business.industry,
    country: business.country,
    timezone: business.timezone,
    currency: business.currency,
    status: mapLifecycleToWorkspaceStatus(lifecycleStatus),
    lifecycleStatus,
    healthStatus: tenantRecord?.healthStatus ?? "HEALTHY",
    createdAt: business.createdAt.toISOString(),
    updatedAt: business.updatedAt.toISOString(),
    owner: {
      id: owner.id,
      fullName: owner.fullName,
      email: owner.email,
    },
    businesses: [
      {
        id: businessId,
        name: workspaceName,
        industry: business.industry,
        status: mapLifecycleToWorkspaceStatus(lifecycleStatus),
        branchCount: tenantRecord?.branchCount ?? branches.length,
      },
    ],
    branches: branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      city: branch.city,
      country: branch.country,
      isMain: branch.isMain,
      isActive: branch.isActive,
      staffCount: branch._count.staff,
    })),
    users,
    subscription: {
      plan: tenantRecord?.subscriptionPlan ?? null,
      status: tenantRecord?.subscriptionStatus ?? "ACTIVE",
      mrrPence: getPlanMrrPence(tenantRecord?.subscriptionPlan),
    },
    usage: {
      storageUsedBytes: (usage?.storageUsedBytes ?? BigInt(0)).toString(),
      maxStorageBytes: limits?.maxStorageBytes?.toString() ?? null,
      aiTokensThisMonth: usage?.aiTokensThisMonth ?? 0,
      maxAiTokensPerMonth: limits?.maxAiTokensPerMonth ?? null,
      activeUsers: usage?.activeUsers ?? users.length,
    },
    health,
    activities: activities.map(serializeTenantActivity),
    auditLogs: auditLogs.map(serializeTenantAuditLog),
    lastActivityAt:
      lastActivityEvent?.createdAt.toISOString() ?? business.updatedAt.toISOString(),
  };

  return { profile, permissions };
}

export async function updateControlCenterWorkspace(
  operator: ControlCenterOperatorContext,
  input: UpdateControlCenterWorkspaceInput,
) {
  const permissions = buildPermissions(operator);

  if (!permissions.canEdit) {
    throw new Error("Permission denied");
  }

  const businessId = resolveBusinessIdFromWorkspaceId(input.workspaceId);
  await buildOperatorTenantPlatformContext(operator, businessId);

  const data: Prisma.BusinessUpdateInput = {};

  if (input.workspaceName !== undefined) data.businessName = input.workspaceName;
  if (input.industry !== undefined) data.industry = input.industry;
  if (input.country !== undefined) data.country = input.country;
  if (input.timezone !== undefined) data.timezone = input.timezone;
  if (input.currency !== undefined) data.currency = input.currency;

  return prisma.business.update({
    where: { id: businessId },
    data,
  });
}

export async function transferControlCenterWorkspaceOwnership(
  operator: ControlCenterOperatorContext,
  input: TransferControlCenterWorkspaceOwnershipInput,
) {
  const permissions = buildPermissions(operator);

  if (!permissions.canTransfer) {
    throw new Error("Permission denied");
  }

  const businessId = resolveBusinessIdFromWorkspaceId(input.workspaceId);
  await buildOperatorTenantPlatformContext(operator, businessId);

  const newOwner = await prisma.user.findUnique({ where: { id: input.newOwnerId } });

  if (!newOwner) {
    throw new Error("New owner not found");
  }

  await tenantFoundationService.transferOwnership(businessId, input.newOwnerId);

  return { workspaceId: input.workspaceId, newOwnerId: input.newOwnerId };
}

export async function runControlCenterWorkspaceLifecycleAction(
  operator: ControlCenterOperatorContext,
  workspaceId: string,
  action: "activate" | "suspend" | "archive" | "delete",
) {
  const permissions = buildPermissions(operator);
  const businessId = resolveBusinessIdFromWorkspaceId(workspaceId);
  const platform = await buildOperatorTenantPlatformContext(operator, businessId);

  switch (action) {
    case "activate":
      if (!permissions.canEdit) throw new Error("Permission denied");
      return activateTenant(platform);
    case "suspend":
      if (!permissions.canSuspend) throw new Error("Permission denied");
      return suspendTenant(platform);
    case "archive":
      if (!permissions.canEdit) throw new Error("Permission denied");
      return archiveTenant(platform);
    case "delete":
      if (!permissions.canDelete) throw new Error("Permission denied");
      return tenantFoundationService.deleteTenant(businessId);
    default:
      throw new Error("Unsupported lifecycle action");
  }
}

export async function runControlCenterWorkspaceBulkAction(
  operator: ControlCenterOperatorContext,
  input: ControlCenterWorkspaceBulkActionInput,
): Promise<ControlCenterWorkspaceBulkActionResult> {
  const permissions = buildPermissions(operator);
  const uniqueIds = [...new Set(input.workspaceIds)];

  if (uniqueIds.length === 0) {
    return { succeeded: [], failed: [] };
  }

  if (input.action === "suspend" && !permissions.canSuspend) {
    throw new Error("Permission denied");
  }

  if ((input.action === "activate" || input.action === "archive") && !permissions.canEdit) {
    throw new Error("Permission denied");
  }

  const lifecycleAction =
    input.action === "suspend"
      ? "suspend"
      : input.action === "activate"
        ? "activate"
        : "archive";

  const succeeded: string[] = [];
  const failed: Array<{ workspaceId: string; error: string }> = [];

  for (const workspaceId of uniqueIds) {
    try {
      await runControlCenterWorkspaceLifecycleAction(operator, workspaceId, lifecycleAction);
      succeeded.push(workspaceId);
    } catch (error) {
      failed.push({
        workspaceId,
        error: error instanceof Error ? error.message : "Action failed",
      });
    }
  }

  return { succeeded, failed };
}

export async function exportControlCenterWorkspacesCsv(
  operator: ControlCenterOperatorContext,
  query: ControlCenterWorkspaceDirectoryQuery = {},
): Promise<string> {
  const permissions = buildPermissions(operator);

  if (!permissions.canExport) {
    throw new Error("Permission denied");
  }

  const result = await queryControlCenterWorkspaceDirectory({
    ...query,
    page: 1,
    pageSize: 10_000,
  });

  const header = [
    "Workspace ID",
    "Workspace Name",
    "Business ID",
    "Owner Email",
    "Status",
    "Health",
    "Plan",
    "Branches",
    "Users",
    "MRR (pence)",
    "AI Tokens",
    "Storage (bytes)",
    "Country",
    "Created At",
    "Last Activity",
  ];

  const rows = result.items.map((item) => [
    item.workspaceId,
    item.workspaceName,
    item.businessId,
    item.ownerEmail,
    item.status,
    item.healthStatus,
    item.subscriptionPlan ?? "",
    String(item.branchCount),
    String(item.userCount),
    String(item.mrrPence),
    String(item.aiTokensThisMonth),
    item.storageUsedBytes,
    item.country ?? "",
    item.createdAt,
    item.lastActivityAt ?? "",
  ]);

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

  return [header, ...rows].map((row) => row.map((cell) => escape(String(cell))).join(",")).join("\n");
}

export async function getControlCenterWorkspaceDetailForDrawer(
  operator: ControlCenterOperatorContext,
  workspaceId: string,
) {
  const bundle = await getControlCenterWorkspaceDetailBundle(operator, workspaceId);
  return bundle.profile;
}
