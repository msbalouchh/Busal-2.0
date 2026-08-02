import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import { CONTROL_CENTER_MARKETPLACE_PAGE_SIZE } from "@/modules/control-center/marketplace/constants/control-center-marketplace";
import {
  mergeMarketplaceItemCompatibility,
  parseLicenseSeatMetadata,
  parseMarketplaceItemCompatibility,
} from "@/modules/control-center/marketplace/lib/marketplace-admin-utils";
import type {
  ControlCenterCatalogItem,
  ControlCenterCatalogQuery,
  ControlCenterCatalogResult,
  ControlCenterIssueReportQuery,
  ControlCenterIssueReportResult,
  ControlCenterLicenseDirectoryResult,
  ControlCenterLicenseQuery,
  ControlCenterMarketplaceActivityItem,
  ControlCenterMarketplaceAnalytics,
  ControlCenterMarketplaceDashboardWidgets,
  ControlCenterMarketplaceItemDetail,
  ControlCenterMarketplaceManagementBundle,
  ControlCenterMarketplacePermissions,
  ControlCenterPackageReviewInput,
  ControlCenterPendingReviewItem,
  ControlCenterPublisherDetail,
  ControlCenterPublisherDirectoryResult,
  ControlCenterPublisherQuery,
} from "@/modules/control-center/marketplace/types/control-center-marketplace-types";
import type { ControlCenterOperatorContext } from "@/modules/control-center/types/control-center-types";
import { ensureMarketplaceCatalogue } from "@/services/marketplace.service";

let cachedAuditBusinessId: string | null = null;

async function resolveAuditBusinessId(): Promise<string> {
  if (cachedAuditBusinessId) {
    return cachedAuditBusinessId;
  }

  const business = await prisma.business.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!business) {
    throw new Error("No business found for marketplace audit logging");
  }

  cachedAuditBusinessId = business.id;
  return business.id;
}

async function logControlCenterMarketplaceAudit(
  entityType: string,
  entityId: string,
  action: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const businessId = await resolveAuditBusinessId();

  await prisma.marketplaceAuditLog.create({
    data: {
      businessId,
      staffId: null,
      entityType,
      entityId,
      action,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

function buildPermissions(
  operator: ControlCenterOperatorContext,
): ControlCenterMarketplacePermissions {
  const permissions = new Set(operator.permissions);
  const hasAdmin = permissions.has(PERMISSION_CODES.CONTROL_CENTER_ADMIN);
  const hasMarketplace =
    hasAdmin || hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE);

  return {
    canViewMarketplace: hasMarketplace,
    canManageCatalog: hasMarketplace,
    canManagePublishers:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE_PUBLISHERS) ||
      hasMarketplace,
    canManageReviews:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE_REVIEWS) ||
      hasMarketplace,
    canManageLicenses:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE_LICENSES) ||
      hasMarketplace,
    canModerate:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE_MODERATION) ||
      hasMarketplace,
    canViewAnalytics:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_MARKETPLACE_ANALYTICS) ||
      hasMarketplace,
  };
}

function serializeCatalogItem(
  item: Prisma.MarketplaceItemGetPayload<{
    include: {
      publisher: true;
      currentVersion: { select: { versionLabel: true } };
    };
  }>,
): ControlCenterCatalogItem {
  const flags = parseMarketplaceItemCompatibility(item.compatibility);

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    description: item.description,
    category: item.category,
    publisherId: item.publisherId,
    publisherName: item.publisher.name,
    pricingType: item.pricingType,
    priceCents: item.priceCents,
    licenseType: item.licenseType,
    averageRating: item.averageRating,
    reviewCount: item.reviewCount,
    downloadCount: item.downloadCount,
    versionLabel: item.currentVersion?.versionLabel ?? null,
    status: item.status,
    featured: flags.featured,
    adminHidden: flags.adminHidden,
    createdAt: item.createdAt.toISOString(),
  };
}

async function loadSuspendedPublisherIds(): Promise<Set<string>> {
  const logs = await prisma.marketplaceAuditLog.findMany({
    where: {
      entityType: "publisher",
      action: { in: ["suspended", "reinstated"] },
    },
    orderBy: { createdAt: "desc" },
    select: { entityId: true, action: true },
  });

  const suspended = new Set<string>();

  for (const log of logs) {
    if (suspended.has(log.entityId)) {
      continue;
    }

    if (log.action === "suspended") {
      suspended.add(log.entityId);
    }
  }

  return suspended;
}

export async function queryControlCenterCatalog(
  query: ControlCenterCatalogQuery = {},
): Promise<ControlCenterCatalogResult> {
  await ensureMarketplaceCatalogue();

  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? CONTROL_CENTER_MARKETPLACE_PAGE_SIZE;

  const where: Prisma.MarketplaceItemWhereInput = {};

  if (query.category) {
    where.category = query.category;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.search?.trim()) {
    where.OR = [
      { name: { contains: query.search.trim(), mode: "insensitive" } },
      { slug: { contains: query.search.trim(), mode: "insensitive" } },
      { publisher: { name: { contains: query.search.trim(), mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.marketplaceItem.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        publisher: true,
        currentVersion: { select: { versionLabel: true } },
      },
    }),
    prisma.marketplaceItem.count({ where }),
  ]);

  let serialized = items.map(serializeCatalogItem);

  if (query.featured === true) {
    serialized = serialized.filter((item) => item.featured);
  } else if (query.featured === false) {
    serialized = serialized.filter((item) => !item.featured);
  }

  return {
    items: serialized,
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

export async function queryControlCenterPublishers(
  query: ControlCenterPublisherQuery = {},
): Promise<ControlCenterPublisherDirectoryResult> {
  await ensureMarketplaceCatalogue();

  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? CONTROL_CENTER_MARKETPLACE_PAGE_SIZE;
  const suspendedIds = await loadSuspendedPublisherIds();

  const where: Prisma.MarketplacePublisherWhereInput = {};

  if (query.search?.trim()) {
    where.OR = [
      { name: { contains: query.search.trim(), mode: "insensitive" } },
      { slug: { contains: query.search.trim(), mode: "insensitive" } },
      { contactEmail: { contains: query.search.trim(), mode: "insensitive" } },
    ];
  }

  if (query.verified === true) {
    where.verified = true;
  } else if (query.verified === false) {
    where.verified = false;
  }

  const publishers = await prisma.marketplacePublisher.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      items: {
        where: { status: "PUBLISHED" },
        select: { averageRating: true },
      },
    },
  });

  let items = await Promise.all(
    publishers.map(async (publisher) => {
      const averageRating =
        publisher.items.length > 0
          ? publisher.items.reduce((sum, item) => sum + item.averageRating, 0) /
            publisher.items.length
          : 0;

      return {
        id: publisher.id,
        slug: publisher.slug,
        name: publisher.name,
        contactEmail: publisher.contactEmail,
        verified: publisher.verified,
        suspended: suspendedIds.has(publisher.id),
        totalDownloads: publisher.totalDownloads,
        totalRevenueCents: publisher.totalRevenueCents,
        publishedPackages: publisher.items.length,
        averageRating,
        createdAt: publisher.createdAt.toISOString(),
      };
    }),
  );

  if (query.suspended === true) {
    items = items.filter((item) => item.suspended);
  } else if (query.suspended === false) {
    items = items.filter((item) => !item.suspended);
  }

  const total = items.length;
  const start = (page - 1) * pageSize;
  const pagedItems = items.slice(start, start + pageSize);

  return {
    items: pagedItems,
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

export async function queryControlCenterLicenses(
  query: ControlCenterLicenseQuery = {},
): Promise<ControlCenterLicenseDirectoryResult> {
  await ensureMarketplaceCatalogue();

  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? CONTROL_CENTER_MARKETPLACE_PAGE_SIZE;

  const where: Prisma.MarketplaceLicenseWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.licenseType) {
    where.licenseType = query.licenseType;
  }

  if (query.search?.trim()) {
    where.OR = [
      { item: { name: { contains: query.search.trim(), mode: "insensitive" } } },
      { business: { businessName: { contains: query.search.trim(), mode: "insensitive" } } },
    ];
  }

  const [licenses, total, active, expired, trial, enterprise] = await Promise.all([
    prisma.marketplaceLicense.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        item: { select: { name: true } },
        business: { select: { businessName: true } },
      },
    }),
    prisma.marketplaceLicense.count({ where }),
    prisma.marketplaceLicense.count({ where: { status: "ACTIVE" } }),
    prisma.marketplaceLicense.count({ where: { status: "EXPIRED" } }),
    prisma.marketplaceLicense.count({ where: { status: "TRIAL" } }),
    prisma.marketplaceLicense.count({ where: { licenseType: "ENTERPRISE" } }),
  ]);

  const renewalsDue = licenses.filter((license) => {
    if (!license.expiresAt || license.status !== "ACTIVE") {
      return false;
    }

    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 30);
    return license.expiresAt.getTime() <= threshold.getTime();
  }).length;

  return {
    items: licenses.map((license) => {
      const seats = parseLicenseSeatMetadata(license.metadata);
      const renewalDue =
        license.expiresAt != null &&
        license.status === "ACTIVE" &&
        license.expiresAt.getTime() <= Date.now() + 30 * 24 * 60 * 60 * 1000;

      return {
        id: license.id,
        businessId: license.businessId,
        businessName: license.business.businessName ?? "Unknown",
        itemId: license.itemId,
        itemName: license.item.name,
        licenseType: license.licenseType,
        status: license.status,
        seatsUsed: seats.seatsUsed,
        seatsTotal: seats.seatsTotal,
        startsAt: license.startsAt.toISOString(),
        expiresAt: license.expiresAt?.toISOString() ?? null,
        renewalDue,
      };
    }),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
    summary: {
      active,
      expired,
      trial,
      enterprise,
      renewalsDue,
    },
  };
}

export async function queryControlCenterIssueReports(
  query: ControlCenterIssueReportQuery = {},
): Promise<ControlCenterIssueReportResult> {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? CONTROL_CENTER_MARKETPLACE_PAGE_SIZE;

  const where: Prisma.MarketplaceIssueReportWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  const [reports, total] = await Promise.all([
    prisma.marketplaceIssueReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        item: { select: { name: true } },
        business: { select: { businessName: true } },
      },
    }),
    prisma.marketplaceIssueReport.count({ where }),
  ]);

  return {
    items: reports.map((report) => ({
      id: report.id,
      itemId: report.itemId,
      itemName: report.item.name,
      businessId: report.businessId,
      businessName: report.business.businessName ?? "Unknown",
      description: report.description,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

async function loadPendingReviews(): Promise<ControlCenterPendingReviewItem[]> {
  const items = await prisma.marketplaceItem.findMany({
    where: { status: "DRAFT" },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      publisher: { select: { name: true } },
      currentVersion: { select: { versionLabel: true } },
    },
  });

  return items.map((item) => {
    const flags = parseMarketplaceItemCompatibility(item.compatibility);

    return {
      id: item.id,
      name: item.name,
      publisherName: item.publisher.name,
      category: item.category,
      versionLabel: item.currentVersion?.versionLabel ?? null,
      submittedAt: item.createdAt.toISOString(),
      securityReviewPassed: flags.securityReviewPassed,
      compatibilityReviewPassed: flags.compatibilityReviewPassed,
      reviewNotes: flags.reviewNotes,
    };
  });
}

async function loadRecentActivity(): Promise<ControlCenterMarketplaceActivityItem[]> {
  const logs = await prisma.marketplaceAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  return logs.map((log) => ({
    id: log.id,
    entityType: log.entityType,
    entityId: log.entityId,
    action: log.action,
    createdAt: log.createdAt.toISOString(),
    metadata:
      log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
        ? (log.metadata as Record<string, unknown>)
        : null,
  }));
}

async function buildDashboardWidgets(): Promise<ControlCenterMarketplaceDashboardWidgets> {
  await ensureMarketplaceCatalogue();

  const [
    totalApps,
    totalAiAgents,
    totalPlugins,
    activeInstallations,
    revenue,
    downloadAggregate,
    ratingAggregate,
    pendingReviews,
    publisherCount,
  ] = await Promise.all([
    prisma.marketplaceItem.count({
      where: { status: { in: ["PUBLISHED", "DEPRECATED"] } },
    }),
    prisma.marketplaceItem.count({
      where: { category: "AI_AGENTS", status: "PUBLISHED" },
    }),
    prisma.marketplaceItem.count({
      where: { category: "PLUGINS", status: "PUBLISHED" },
    }),
    prisma.marketplaceInstallation.count({ where: { status: "INSTALLED" } }),
    prisma.marketplaceRevenueRecord.aggregate({ _sum: { amountCents: true } }),
    prisma.marketplaceItem.aggregate({ _sum: { downloadCount: true } }),
    prisma.marketplaceItem.aggregate({
      where: { status: "PUBLISHED" },
      _avg: { averageRating: true },
    }),
    prisma.marketplaceItem.count({ where: { status: "DRAFT" } }),
    prisma.marketplacePublisher.count(),
  ]);

  return {
    totalApps,
    totalAiAgents,
    totalPlugins,
    activeInstallations,
    revenueCents: revenue._sum.amountCents ?? 0,
    totalDownloads: downloadAggregate._sum.downloadCount ?? 0,
    averageRating: ratingAggregate._avg.averageRating ?? 0,
    pendingReviews,
    publisherCount,
  };
}

async function buildAnalytics(): Promise<ControlCenterMarketplaceAnalytics> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [installations, revenueRecords, reviews, items, agentItems] = await Promise.all([
    prisma.marketplaceInstallation.findMany({
      where: { installedAt: { gte: sixMonthsAgo } },
      select: { installedAt: true },
    }),
    prisma.marketplaceRevenueRecord.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, amountCents: true, itemId: true },
    }),
    prisma.marketplaceReview.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, rating: true },
    }),
    prisma.marketplaceItem.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        downloadCount: true,
        averageRating: true,
      },
    }),
    prisma.marketplaceItem.findMany({
      where: { category: "AI_AGENTS", status: "PUBLISHED" },
      include: { _count: { select: { installations: true } } },
    }),
  ]);

  const monthKeys: string[] = [];
  for (let index = 0; index < 6; index += 1) {
    const date = new Date(sixMonthsAgo);
    date.setMonth(sixMonthsAgo.getMonth() + index);
    monthKeys.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  }

  const downloadTrends = monthKeys.map((month) => ({
    month,
    downloads: installations.filter(
      (entry) =>
        `${entry.installedAt.getFullYear()}-${String(entry.installedAt.getMonth() + 1).padStart(2, "0")}` ===
        month,
    ).length,
  }));

  const installationTrends = downloadTrends.map((entry) => ({
    month: entry.month,
    installations: entry.downloads,
  }));

  const revenueTrends = monthKeys.map((month) => ({
    month,
    revenueCents: revenueRecords
      .filter(
        (entry) =>
          `${entry.createdAt.getFullYear()}-${String(entry.createdAt.getMonth() + 1).padStart(2, "0")}` ===
          month,
      )
      .reduce((sum, entry) => sum + entry.amountCents, 0),
  }));

  const ratingTrends = monthKeys.map((month) => {
    const monthReviews = reviews.filter(
      (entry) =>
        `${entry.createdAt.getFullYear()}-${String(entry.createdAt.getMonth() + 1).padStart(2, "0")}` ===
        month,
    );

    const averageRating =
      monthReviews.length > 0
        ? monthReviews.reduce((sum, entry) => sum + entry.rating, 0) / monthReviews.length
        : 0;

    return { month, averageRating: Math.round(averageRating * 10) / 10 };
  });

  const categoryMap = new Map<string, number>();
  for (const item of items) {
    categoryMap.set(item.category, (categoryMap.get(item.category) ?? 0) + 1);
  }

  const revenueByItem = new Map<string, number>();
  for (const record of revenueRecords) {
    revenueByItem.set(record.itemId, (revenueByItem.get(record.itemId) ?? 0) + record.amountCents);
  }

  const topPackages = items
    .map((item) => ({
      itemId: item.id,
      name: item.name,
      downloads: item.downloadCount,
      revenueCents: revenueByItem.get(item.id) ?? 0,
    }))
    .sort((left, right) => right.downloads - left.downloads)
    .slice(0, 5);

  const agentPerformance = agentItems
    .map((item) => ({
      itemId: item.id,
      name: item.name,
      installations: item._count.installations,
      averageRating: item.averageRating,
    }))
    .sort((left, right) => right.installations - left.installations)
    .slice(0, 5);

  return {
    downloadTrends,
    installationTrends,
    revenueTrends,
    ratingTrends,
    categoryBreakdown: [...categoryMap.entries()].map(([category, count]) => ({
      category,
      count,
    })),
    topPackages,
    agentPerformance,
  };
}

export async function getControlCenterMarketplaceManagementBundle(
  operator: ControlCenterOperatorContext,
  catalogQuery: ControlCenterCatalogQuery = {},
): Promise<ControlCenterMarketplaceManagementBundle> {
  const permissions = buildPermissions(operator);

  const [
    widgets,
    recentActivity,
    catalog,
    publishers,
    licenses,
    pendingReviews,
    issueReports,
    analytics,
    featuredAgentsRaw,
  ] = await Promise.all([
    buildDashboardWidgets(),
    loadRecentActivity(),
    queryControlCenterCatalog(catalogQuery),
    queryControlCenterPublishers({ page: 1, pageSize: 10 }),
    queryControlCenterLicenses({ page: 1, pageSize: 10 }),
    loadPendingReviews(),
    queryControlCenterIssueReports({ status: "OPEN", page: 1, pageSize: 10 }),
    buildAnalytics(),
    queryControlCenterCatalog({
      category: "AI_AGENTS",
      status: "PUBLISHED",
      featured: true,
      page: 1,
      pageSize: 5,
    }),
  ]);

  return {
    widgets,
    permissions,
    recentActivity,
    catalog,
    publishers,
    licenses,
    pendingReviews,
    issueReports,
    analytics,
    featuredAgents: featuredAgentsRaw.items,
  };
}

export async function getControlCenterMarketplaceItemDetail(
  itemId: string,
): Promise<ControlCenterMarketplaceItemDetail> {
  const item = await prisma.marketplaceItem.findUnique({
    where: { id: itemId },
    include: {
      publisher: true,
      currentVersion: { select: { versionLabel: true } },
      versions: { orderBy: { versionNumber: "desc" } },
      _count: { select: { installations: true } },
    },
  });

  if (!item) {
    throw new Error("Marketplace item not found");
  }

  const revenue = await prisma.marketplaceRevenueRecord.aggregate({
    where: { itemId },
    _sum: { amountCents: true },
  });

  return {
    item: serializeCatalogItem(item),
    versions: item.versions.map((version) => ({
      id: version.id,
      versionLabel: version.versionLabel,
      versionNumber: version.versionNumber,
      status: version.status,
      publishedAt: version.publishedAt?.toISOString() ?? null,
      minBusalVersion: version.minBusalVersion,
      requiresAi: version.requiresAi,
    })),
    installations: item._count.installations,
    revenueCents: revenue._sum.amountCents ?? 0,
  };
}

export async function getControlCenterPublisherDetail(
  publisherId: string,
): Promise<ControlCenterPublisherDetail> {
  const directory = await queryControlCenterPublishers({ page: 1, pageSize: 1000 });
  const publisher = directory.items.find((entry) => entry.id === publisherId);

  if (!publisher) {
    throw new Error("Publisher not found");
  }

  const packages = await queryControlCenterCatalog({
    page: 1,
    pageSize: 50,
    search: publisher.name,
  });

  return {
    publisher,
    packages: packages.items.filter((item) => item.publisherId === publisherId),
    revenueCents: publisher.totalRevenueCents,
    totalDownloads: publisher.totalDownloads,
  };
}

async function getItemCompatibilityRecord(itemId: string) {
  const item = await prisma.marketplaceItem.findUnique({
    where: { id: itemId },
    select: { compatibility: true },
  });

  if (!item) {
    throw new Error("Marketplace item not found");
  }

  return item.compatibility;
}

export async function runControlCenterFeaturePackage(
  itemId: string,
  featured: boolean,
): Promise<void> {
  const compatibility = await getItemCompatibilityRecord(itemId);

  await prisma.marketplaceItem.update({
    where: { id: itemId },
    data: {
      compatibility: mergeMarketplaceItemCompatibility(compatibility, { featured }),
    },
  });

  await logControlCenterMarketplaceAudit("item", itemId, featured ? "featured" : "unfeatured");
}

export async function runControlCenterHidePackage(itemId: string, hidden: boolean): Promise<void> {
  const compatibility = await getItemCompatibilityRecord(itemId);

  await prisma.marketplaceItem.update({
    where: { id: itemId },
    data: {
      compatibility: mergeMarketplaceItemCompatibility(compatibility, { adminHidden: hidden }),
    },
  });

  await logControlCenterMarketplaceAudit("item", itemId, hidden ? "hidden" : "unhidden");
}

export async function runControlCenterArchivePackage(itemId: string): Promise<void> {
  await prisma.marketplaceItem.update({
    where: { id: itemId },
    data: { status: "ARCHIVED" },
  });

  await logControlCenterMarketplaceAudit("item", itemId, "archived");
}

export async function runControlCenterRestorePackage(itemId: string): Promise<void> {
  await prisma.marketplaceItem.update({
    where: { id: itemId },
    data: { status: "PUBLISHED" },
  });

  await logControlCenterMarketplaceAudit("item", itemId, "restored");
}

export async function runControlCenterRemovePackage(itemId: string): Promise<void> {
  await prisma.marketplaceItem.update({
    where: { id: itemId },
    data: { status: "ARCHIVED" },
  });

  await logControlCenterMarketplaceAudit("item", itemId, "removed");
}

export async function runControlCenterSuspendPackage(itemId: string): Promise<void> {
  await prisma.marketplaceItem.update({
    where: { id: itemId },
    data: { status: "DEPRECATED" },
  });

  await logControlCenterMarketplaceAudit("item", itemId, "suspended");
}

export async function runControlCenterApprovePackage(itemId: string): Promise<void> {
  await prisma.marketplaceItem.update({
    where: { id: itemId },
    data: { status: "PUBLISHED" },
  });

  await prisma.marketplaceItemVersion.updateMany({
    where: { itemId, status: "DRAFT" },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });

  await logControlCenterMarketplaceAudit("item", itemId, "approved");
}

export async function runControlCenterRejectPackage(
  itemId: string,
  reason?: string,
): Promise<void> {
  const compatibility = await getItemCompatibilityRecord(itemId);

  await prisma.marketplaceItem.update({
    where: { id: itemId },
    data: {
      status: "ARCHIVED",
      compatibility: mergeMarketplaceItemCompatibility(compatibility, {
        reviewNotes: reason ?? "Rejected by marketplace administrator",
      }),
    },
  });

  await logControlCenterMarketplaceAudit("item", itemId, "rejected", { reason });
}

export async function runControlCenterRequestPackageChanges(
  itemId: string,
  notes: string,
): Promise<void> {
  const compatibility = await getItemCompatibilityRecord(itemId);

  await prisma.marketplaceItem.update({
    where: { id: itemId },
    data: {
      status: "DRAFT",
      compatibility: mergeMarketplaceItemCompatibility(compatibility, { reviewNotes: notes }),
    },
  });

  await logControlCenterMarketplaceAudit("item", itemId, "changes_requested", { notes });
}

export async function runControlCenterUpdatePackageReview(
  input: ControlCenterPackageReviewInput,
): Promise<void> {
  const compatibility = await getItemCompatibilityRecord(input.itemId);
  const patch: Record<string, unknown> = {};

  if (input.securityReviewPassed != null) {
    patch.securityReviewPassed = input.securityReviewPassed;
  }

  if (input.compatibilityReviewPassed != null) {
    patch.compatibilityReviewPassed = input.compatibilityReviewPassed;
  }

  if (input.reviewNotes != null) {
    patch.reviewNotes = input.reviewNotes;
  }

  await prisma.marketplaceItem.update({
    where: { id: input.itemId },
    data: { compatibility: mergeMarketplaceItemCompatibility(compatibility, patch) },
  });

  await logControlCenterMarketplaceAudit("item", input.itemId, "review_updated", patch);
}

export async function runControlCenterVerifyPublisher(publisherId: string): Promise<void> {
  await prisma.marketplacePublisher.update({
    where: { id: publisherId },
    data: { verified: true },
  });

  await logControlCenterMarketplaceAudit("publisher", publisherId, "verified");
}

export async function runControlCenterSuspendPublisher(publisherId: string): Promise<void> {
  await prisma.marketplacePublisher.update({
    where: { id: publisherId },
    data: { verified: false },
  });

  await prisma.marketplaceItem.updateMany({
    where: { publisherId, status: "PUBLISHED" },
    data: { status: "DEPRECATED" },
  });

  await logControlCenterMarketplaceAudit("publisher", publisherId, "suspended");
}

export async function runControlCenterReinstatePublisher(publisherId: string): Promise<void> {
  await prisma.marketplacePublisher.update({
    where: { id: publisherId },
    data: { verified: true },
  });

  await logControlCenterMarketplaceAudit("publisher", publisherId, "reinstated");
}

export async function runControlCenterResolveIssueReport(
  reportId: string,
  status: "RESOLVED" | "DISMISSED",
): Promise<void> {
  const report = await prisma.marketplaceIssueReport.update({
    where: { id: reportId },
    data: { status },
  });

  await logControlCenterMarketplaceAudit("issue_report", reportId, status.toLowerCase(), {
    itemId: report.itemId,
  });
}
