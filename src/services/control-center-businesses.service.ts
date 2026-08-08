import "server-only";

import type { BusinessType, Prisma, TenantLifecycleStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import { getPlanMrrPence } from "@/modules/control-center/billing/registry/subscription-plan-registry";
import { buildOperatorTenantPlatformContext } from "@/modules/control-center/tenants/lib/build-operator-tenant-context";
import { CONTROL_CENTER_BUSINESS_PAGE_SIZE } from "@/modules/control-center/businesses/constants/control-center-businesses";
import type {
  ControlCenterBusinessBulkActionInput,
  ControlCenterBusinessBulkActionResult,
  ControlCenterBusinessDetailBundle,
  ControlCenterBusinessDirectoryItem,
  ControlCenterBusinessDirectoryQuery,
  ControlCenterBusinessDirectoryResult,
  ControlCenterBusinessManagementBundle,
  ControlCenterBusinessPermissions,
  ControlCenterBusinessStatistics,
  TransferControlCenterBusinessOwnershipInput,
  UpdateControlCenterBusinessInput,
} from "@/modules/control-center/businesses/types/control-center-businesses-types";
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

function buildPermissions(operator: ControlCenterOperatorContext): ControlCenterBusinessPermissions {
  const permissions = new Set(operator.permissions);
  const hasAdmin = permissions.has(PERMISSION_CODES.CONTROL_CENTER_ADMIN);

  return {
    canView:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_BUSINESSES) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_VIEW),
    canEdit:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_BUSINESSES_EDIT) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_BUSINESSES),
    canSuspend:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_BUSINESSES_SUSPEND) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_BUSINESSES),
    canDelete:
      hasAdmin || hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_BUSINESSES_DELETE),
    canTransfer:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_BUSINESSES_TRANSFER) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_BUSINESSES_EDIT),
    canExport:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_BUSINESSES) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_VIEW),
  };
}

function buildDirectoryWhere(
  query: ControlCenterBusinessDirectoryQuery,
): Prisma.BusinessWhereInput {
  const where: Prisma.BusinessWhereInput = {};
  const tenantWhere: Prisma.TenantRecordWhereInput = {};

  if (query.status) {
    tenantWhere.lifecycleStatus = query.status;
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

  if (query.businessType?.trim()) {
    where.businessType = query.businessType.trim() as BusinessType;
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
      { businessEmail: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

function buildDirectoryOrderBy(
  query: ControlCenterBusinessDirectoryQuery,
): Prisma.BusinessOrderByWithRelationInput {
  const direction = query.sortDirection ?? "desc";

  switch (query.sortBy) {
    case "businessName":
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

async function buildStatistics(): Promise<ControlCenterBusinessStatistics> {
  const [totalBusinesses, statusGroups, branchAggregate, staffCount, tenantRecords] =
    await Promise.all([
      prisma.business.count(),
      prisma.tenantRecord.groupBy({
        by: ["lifecycleStatus"],
        _count: { _all: true },
      }),
      prisma.tenantRecord.aggregate({ _sum: { branchCount: true } }),
      prisma.staff.count({ where: { isActive: true } }),
      prisma.tenantRecord.findMany({
        select: { subscriptionPlan: true, subscriptionStatus: true },
      }),
    ]);

  const statusMap = new Map(statusGroups.map((row) => [row.lifecycleStatus, row._count._all]));
  const mrrPence = tenantRecords.reduce(
    (sum, record) =>
      record.subscriptionStatus === "ACTIVE" || record.subscriptionStatus === "TRIAL"
        ? sum + getPlanMrrPence(record.subscriptionPlan)
        : sum,
    0,
  );

  return {
    totalBusinesses,
    activeBusinesses: statusMap.get("ACTIVE") ?? 0,
    suspendedBusinesses: statusMap.get("SUSPENDED") ?? 0,
    archivedBusinesses: (statusMap.get("ARCHIVED") ?? 0) + (statusMap.get("DELETED") ?? 0),
    totalBranches: branchAggregate._sum.branchCount ?? 0,
    totalStaff: staffCount,
    totalMrrPence: mrrPence,
  };
}

async function loadRevenueByBusiness(
  businessIds: string[],
): Promise<Map<string, number>> {
  if (businessIds.length === 0) {
    return new Map();
  }

  const invoiceTotals = await prisma.revenueInvoice.groupBy({
    by: ["businessId"],
    where: { businessId: { in: businessIds }, status: "PAID" },
    _sum: { totalPence: true },
  });

  return new Map(
    invoiceTotals.map((row) => [row.businessId, row._sum.totalPence ?? 0]),
  );
}

function mapDirectoryItem(
  business: {
    id: string;
    businessName: string | null;
    businessCode: string | null;
    businessType: BusinessType | null;
    industry: string | null;
    country: string | null;
    ownerName: string | null;
    createdAt: Date;
    updatedAt: Date;
    owner: { email: string };
    tenantRecord: {
      lifecycleStatus: TenantLifecycleStatus;
      healthStatus: string;
      subscriptionPlan: string | null;
      subscriptionStatus: string;
      branchCount: number;
    } | null;
  },
  staffCount: number,
  usage: {
    aiTokensThisMonth: number;
    storageUsedBytes: bigint;
  } | null,
  lastActivity: Date | null,
  revenuePence: number,
): ControlCenterBusinessDirectoryItem {
  const tenant = business.tenantRecord;

  return {
    id: business.id,
    businessId: business.id,
    businessName: business.businessName ?? "Untitled business",
    businessCode: business.businessCode,
    businessType: business.businessType,
    industry: business.industry,
    country: business.country,
    ownerName: business.ownerName,
    ownerEmail: business.owner.email,
    status: tenant?.lifecycleStatus ?? "PENDING",
    healthStatus: (tenant?.healthStatus ?? "HEALTHY") as ControlCenterBusinessDirectoryItem["healthStatus"],
    branchCount: tenant?.branchCount ?? 0,
    staffCount,
    subscriptionPlan: tenant?.subscriptionPlan ?? null,
    subscriptionStatus: tenant?.subscriptionStatus ?? "ACTIVE",
    mrrPence: getPlanMrrPence(tenant?.subscriptionPlan),
    aiTokensThisMonth: usage?.aiTokensThisMonth ?? 0,
    storageUsedBytes: (usage?.storageUsedBytes ?? BigInt(0)).toString(),
    revenuePence,
    lastActivityAt: lastActivity?.toISOString() ?? business.updatedAt.toISOString(),
    createdAt: business.createdAt.toISOString(),
  };
}

export async function queryControlCenterBusinessDirectory(
  query: ControlCenterBusinessDirectoryQuery = {},
): Promise<ControlCenterBusinessDirectoryResult> {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? CONTROL_CENTER_BUSINESS_PAGE_SIZE;
  const where = buildDirectoryWhere(query);
  const orderBy = buildDirectoryOrderBy(query);

  const [businesses, total, statistics] = await Promise.all([
    prisma.business.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        owner: { select: { email: true } },
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
    buildStatistics(),
  ]);

  const businessIds = businesses.map((business) => business.id);

  const [staffCounts, usageRows, activityRows, revenueMap] = await Promise.all([
    prisma.staff.groupBy({
      by: ["businessId"],
      where: { businessId: { in: businessIds }, isActive: true },
      _count: { _all: true },
    }),
    prisma.tenantResourceUsage.findMany({
      where: { businessId: { in: businessIds } },
      select: {
        businessId: true,
        aiTokensThisMonth: true,
        storageUsedBytes: true,
      },
    }),
    prisma.tenantActivityEvent.groupBy({
      by: ["businessId"],
      where: { businessId: { in: businessIds } },
      _max: { createdAt: true },
    }),
    loadRevenueByBusiness(businessIds),
  ]);

  const staffMap = new Map(staffCounts.map((row) => [row.businessId, row._count._all]));
  const usageMap = new Map(usageRows.map((row) => [row.businessId, row]));
  const activityMap = new Map(activityRows.map((row) => [row.businessId, row._max.createdAt]));

  let items = businesses.map((business) =>
    mapDirectoryItem(
      business,
      staffMap.get(business.id) ?? 0,
      usageMap.get(business.id) ?? null,
      activityMap.get(business.id) ?? null,
      revenueMap.get(business.id) ?? 0,
    ),
  );

  if (query.sortBy === "staffCount") {
    const direction = query.sortDirection === "asc" ? 1 : -1;
    items = [...items].sort((a, b) => (a.staffCount - b.staffCount) * direction);
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

export async function getControlCenterBusinessManagementBundle(
  operator: ControlCenterOperatorContext,
  query: ControlCenterBusinessDirectoryQuery = {},
): Promise<ControlCenterBusinessManagementBundle> {
  const permissions = buildPermissions(operator);

  if (!permissions.canView) {
    throw new Error("Permission denied");
  }

  const directory = await queryControlCenterBusinessDirectory(query);

  return { directory, permissions };
}

export async function getControlCenterBusinessDetailBundle(
  operator: ControlCenterOperatorContext,
  businessId: string,
): Promise<ControlCenterBusinessDetailBundle> {
  const permissions = buildPermissions(operator);

  if (!permissions.canView) {
    throw new Error("Permission denied");
  }

  await ensureTenantPlatformDefaults(businessId);
  const platform = await buildOperatorTenantPlatformContext(operator, businessId);

  const [
    business,
    tenantRecord,
    usage,
    limits,
    branches,
    staffCount,
    invoices,
    invoicePayments,
    aiToolCount,
    aiAgentCount,
    businessModules,
    featureFlagCount,
    activities,
    auditLogs,
    health,
    lastActivityEvent,
  ] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      include: { owner: { select: { id: true, email: true, fullName: true } } },
    }),
    prisma.tenantRecord.findUnique({ where: { businessId } }),
    prisma.tenantResourceUsage.findUnique({ where: { businessId } }),
    prisma.tenantResourceLimit.findUnique({ where: { businessId } }),
    prisma.branch.findMany({
      where: { businessId },
      orderBy: [{ isMain: "desc" }, { name: "asc" }],
      include: { _count: { select: { staff: true } } },
    }),
    prisma.staff.count({ where: { businessId, isActive: true } }),
    prisma.revenueInvoice.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.revenueInvoicePayment.findMany({
      where: { invoice: { businessId } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { invoice: { select: { invoiceNumber: true } } },
    }),
    prisma.aiToolExecution.count({ where: { businessId } }),
    prisma.aiAgentExecution.count({ where: { businessId } }),
    prisma.businessModule.findMany({
      where: { businessId, isEnabled: true },
      select: { moduleKey: true, moduleName: true },
    }),
    prisma.featureFlag.count({ where: { businessId, status: "ACTIVE" } }),
    listTenantActivityEvents(businessId),
    listTenantPlatformAuditLogs(businessId),
    runTenantHealthCheck(platform),
    prisma.tenantActivityEvent.findFirst({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  if (!business) {
    throw new Error("Business not found");
  }

  const assignedFeatures = Array.isArray(tenantRecord?.assignedFeatures)
    ? (tenantRecord.assignedFeatures as string[])
    : [];

  const paidInvoicesPence = invoices
    .filter((invoice) => invoice.status === "PAID")
    .reduce((sum, invoice) => sum + invoice.totalPence, 0);
  const outstandingPence = invoices
    .filter((invoice) => invoice.status !== "PAID" && invoice.status !== "WRITTEN_OFF")
    .reduce((sum, invoice) => sum + invoice.totalPence - invoice.amountPaidPence, 0);

  const storageUsedBytes = usage?.storageUsedBytes ?? BigInt(0);
  const maxStorageBytes = limits?.maxStorageBytes ?? null;
  const usagePercent =
    maxStorageBytes && maxStorageBytes > BigInt(0)
      ? Number((storageUsedBytes * BigInt(100)) / maxStorageBytes)
      : 0;

  return {
    permissions,
    profile: {
      businessId: business.id,
      businessName: business.businessName,
      businessCode: business.businessCode,
      businessType: business.businessType,
      industry: business.industry,
      country: business.country,
      timezone: business.timezone,
      currency: business.currency,
      phone: business.phone,
      businessEmail: business.businessEmail,
      onboardingCompleted: business.onboardingCompleted,
      createdAt: business.createdAt.toISOString(),
      updatedAt: business.updatedAt.toISOString(),
      owner: {
        id: business.owner.id,
        fullName: business.owner.fullName,
        email: business.owner.email,
      },
      status: tenantRecord?.lifecycleStatus ?? "PENDING",
      healthStatus: tenantRecord?.healthStatus ?? "HEALTHY",
      subscriptionPlan: tenantRecord?.subscriptionPlan ?? null,
      subscriptionStatus: tenantRecord?.subscriptionStatus ?? "ACTIVE",
      branchCount: tenantRecord?.branchCount ?? branches.length,
      staffCount,
      branches: branches.map((branch) => ({
        id: branch.id,
        name: branch.name,
        city: branch.city,
        country: branch.country,
        isMain: branch.isMain,
        isActive: branch.isActive,
        staffCount: branch._count.staff,
      })),
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        totalPence: invoice.totalPence,
        amountPaidPence: invoice.amountPaidPence,
        dueAt: invoice.dueAt?.toISOString() ?? null,
        paidAt: invoice.paidAt?.toISOString() ?? null,
      })),
      payments: invoicePayments.map((payment) => ({
        id: payment.id,
        amountPence: payment.amountPence,
        status: payment.status,
        method: payment.paymentMethod,
        createdAt: payment.createdAt.toISOString(),
        reference: payment.providerReference,
      })),
      revenue: {
        totalRevenuePence: paidInvoicesPence,
        paidInvoicesPence,
        outstandingPence,
        mrrPence: getPlanMrrPence(tenantRecord?.subscriptionPlan),
      },
      aiUsage: {
        aiTokensThisMonth: usage?.aiTokensThisMonth ?? 0,
        aiToolExecutions: aiToolCount,
        aiAgentExecutions: aiAgentCount,
        maxAiTokensPerMonth: limits?.maxAiTokensPerMonth ?? null,
      },
      storage: {
        storageUsedBytes: storageUsedBytes.toString(),
        maxStorageBytes: maxStorageBytes?.toString() ?? null,
        fileCount: usage?.fileCount ?? 0,
        usagePercent,
      },
      featureAccess: {
        assignedFeatures,
        enabledModules: businessModules.map((module) => module.moduleKey),
        activeFeatureFlags: featureFlagCount,
      },
      health,
      activities: activities.map(serializeTenantActivity),
      auditLogs: auditLogs.map(serializeTenantAuditLog),
      lastActivityAt:
        lastActivityEvent?.createdAt.toISOString() ?? business.updatedAt.toISOString(),
    },
  };
}

export async function updateControlCenterBusiness(
  operator: ControlCenterOperatorContext,
  input: UpdateControlCenterBusinessInput,
) {
  const permissions = buildPermissions(operator);

  if (!permissions.canEdit) {
    throw new Error("Permission denied");
  }

  await buildOperatorTenantPlatformContext(operator, input.businessId);

  const data: Prisma.BusinessUpdateInput = {};

  if (input.businessName !== undefined) data.businessName = input.businessName;
  if (input.businessType !== undefined) data.businessType = input.businessType as BusinessType;
  if (input.industry !== undefined) data.industry = input.industry;
  if (input.country !== undefined) data.country = input.country;
  if (input.timezone !== undefined) data.timezone = input.timezone;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.businessEmail !== undefined) data.businessEmail = input.businessEmail;

  return prisma.business.update({
    where: { id: input.businessId },
    data,
  });
}

export async function transferControlCenterBusinessOwnership(
  operator: ControlCenterOperatorContext,
  input: TransferControlCenterBusinessOwnershipInput,
) {
  const permissions = buildPermissions(operator);

  if (!permissions.canTransfer) {
    throw new Error("Permission denied");
  }

  await buildOperatorTenantPlatformContext(operator, input.businessId);

  const newOwner = await prisma.user.findUnique({ where: { id: input.newOwnerId } });

  if (!newOwner) {
    throw new Error("New owner not found");
  }

  await tenantFoundationService.transferOwnership(input.businessId, input.newOwnerId);

  return { businessId: input.businessId, newOwnerId: input.newOwnerId };
}

export async function runControlCenterBusinessLifecycleAction(
  operator: ControlCenterOperatorContext,
  businessId: string,
  action: "activate" | "suspend" | "archive" | "delete",
) {
  const permissions = buildPermissions(operator);
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

export async function runControlCenterBusinessBulkAction(
  operator: ControlCenterOperatorContext,
  input: ControlCenterBusinessBulkActionInput,
): Promise<ControlCenterBusinessBulkActionResult> {
  const permissions = buildPermissions(operator);
  const uniqueIds = [...new Set(input.businessIds)];

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
  const failed: Array<{ businessId: string; error: string }> = [];

  for (const businessId of uniqueIds) {
    try {
      await runControlCenterBusinessLifecycleAction(operator, businessId, lifecycleAction);
      succeeded.push(businessId);
    } catch (error) {
      failed.push({
        businessId,
        error: error instanceof Error ? error.message : "Action failed",
      });
    }
  }

  return { succeeded, failed };
}

export async function exportControlCenterBusinessesCsv(
  operator: ControlCenterOperatorContext,
  query: ControlCenterBusinessDirectoryQuery = {},
): Promise<string> {
  const permissions = buildPermissions(operator);

  if (!permissions.canExport) {
    throw new Error("Permission denied");
  }

  const result = await queryControlCenterBusinessDirectory({
    ...query,
    page: 1,
    pageSize: 10_000,
  });

  const header = [
    "Business ID",
    "Business Name",
    "Business Code",
    "Owner Email",
    "Status",
    "Health",
    "Plan",
    "Branches",
    "Staff",
    "MRR (pence)",
    "AI Tokens",
    "Storage (bytes)",
    "Country",
    "Created At",
    "Last Activity",
  ];

  const rows = result.items.map((item) => [
    item.businessId,
    item.businessName,
    item.businessCode ?? "",
    item.ownerEmail,
    item.status,
    item.healthStatus,
    item.subscriptionPlan ?? "",
    String(item.branchCount),
    String(item.staffCount),
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

export async function getControlCenterBusinessDetailForDrawer(
  operator: ControlCenterOperatorContext,
  businessId: string,
) {
  const bundle = await getControlCenterBusinessDetailBundle(operator, businessId);
  return bundle.profile;
}
