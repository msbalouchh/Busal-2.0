import "server-only";

import type { MarketplaceInstallAction, MarketplaceLicenseType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  BUSAL_PLATFORM_VERSION,
  DEFAULT_MARKETPLACE_COMMISSION_RATE,
} from "@/modules/marketplace/constants/routes";
import { runInstallationAction } from "@/modules/marketplace/engine/installation-engine";
import {
  calculateRevenueSplit,
  isLicenseActive,
  resolveLicenseExpiry,
} from "@/modules/marketplace/engine/licensing-engine";
import {
  DEFAULT_MARKETPLACE_CATALOGUE,
  ensureBootstrapMarketplacePlugins,
} from "@/modules/marketplace/plugins/bootstrap-marketplace";
import type {
  CompatibilityContext,
  MarketplaceDashboardMetrics,
  PublisherDashboardMetrics,
} from "@/modules/marketplace/types/marketplace-types";

function assertPermission(platform: BusinessContext, permission: string): void {
  if (!platform.permissions.includes(permission)) {
    throw new Error(`Permission denied: ${permission} required`);
  }
}

async function logMarketplaceAudit(
  businessId: string,
  staffId: string | null,
  entityType: string,
  entityId: string,
  action: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await prisma.marketplaceAuditLog.create({
    data: {
      businessId,
      staffId,
      entityType,
      entityId,
      action,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

function buildCompatibilityContext(platform: BusinessContext): CompatibilityContext {
  const installedModules = [
    "crm",
    "sales-crm",
    "menu",
    "kitchen",
    "inventory",
    "reporting",
    "revops",
    "quotes",
    "payments",
    "ai-tools",
    "ai-knowledge",
    "ai-automation",
    "ai-agents",
  ];

  return {
    busalVersion: BUSAL_PLATFORM_VERSION,
    installedModules,
    industry: null,
    hasAiFeatures: platform.permissions.some((permission) => permission.startsWith("ai.")),
    installedDependencies: [],
    permissions: platform.permissions,
  };
}

function buildInstallationDependencies() {
  return {
    getItemVersion: async (versionId: string) =>
      prisma.marketplaceItemVersion.findUnique({
        where: { id: versionId },
        select: {
          id: true,
          itemId: true,
          versionNumber: true,
          minBusalVersion: true,
          requiredModules: true,
          requiredIndustries: true,
          requiresAi: true,
          status: true,
        },
      }),
    getItem: async (itemId: string) =>
      prisma.marketplaceItem.findUnique({
        where: { id: itemId },
        select: {
          id: true,
          slug: true,
          dependencies: true,
          permissionsRequired: true,
          status: true,
        },
      }),
    getInstallation: async (businessId: string, itemId: string) =>
      prisma.marketplaceInstallation.findUnique({
        where: { businessId_itemId: { businessId, itemId } },
        select: { id: true, versionId: true, previousVersionId: true, status: true },
      }),
    getInstalledSlugs: async (businessId: string) => {
      const installations = await prisma.marketplaceInstallation.findMany({
        where: { businessId, status: "INSTALLED" },
        include: { item: { select: { slug: true } } },
      });

      return installations.map((installation) => installation.item.slug);
    },
    upsertInstallation: async (input: {
      businessId: string;
      itemId: string;
      versionId: string;
      previousVersionId?: string | null;
      status: "INSTALLED" | "UPDATING" | "FAILED" | "UNINSTALLED" | "ROLLED_BACK";
    }) => {
      const installation = await prisma.marketplaceInstallation.upsert({
        where: {
          businessId_itemId: {
            businessId: input.businessId,
            itemId: input.itemId,
          },
        },
        create: {
          businessId: input.businessId,
          itemId: input.itemId,
          versionId: input.versionId,
          previousVersionId: input.previousVersionId ?? null,
          status: input.status,
        },
        update: {
          versionId: input.versionId,
          previousVersionId: input.previousVersionId ?? null,
          status: input.status,
        },
        select: { id: true },
      });

      return installation;
    },
    recordHistory: async (input: {
      businessId: string;
      itemId: string;
      versionId: string;
      action: MarketplaceInstallAction;
      status: "INSTALLED" | "UPDATING" | "FAILED" | "UNINSTALLED" | "ROLLED_BACK";
      installationId?: string | null;
      fromVersionId?: string | null;
    }) => {
      await prisma.marketplaceInstallationHistory.create({
        data: {
          businessId: input.businessId,
          installationId: input.installationId ?? null,
          itemId: input.itemId,
          versionId: input.versionId,
          fromVersionId: input.fromVersionId ?? null,
          action: input.action,
          status: input.status,
        },
      });
    },
  };
}

export async function ensureMarketplaceCatalogue(): Promise<void> {
  ensureBootstrapMarketplacePlugins();

  let publisher = await prisma.marketplacePublisher.findUnique({
    where: { slug: "busal-labs" },
  });

  if (!publisher) {
    publisher = await prisma.marketplacePublisher.create({
      data: {
        slug: "busal-labs",
        name: "Busal Labs",
        description: "Official Busal OS extension publisher.",
        contactEmail: "marketplace@busal.app",
        verified: true,
      },
    });
  }

  for (const extension of DEFAULT_MARKETPLACE_CATALOGUE) {
    const existing = await prisma.marketplaceItem.findUnique({
      where: { slug: extension.slug },
    });

    if (existing) {
      continue;
    }

    const item = await prisma.marketplaceItem.create({
      data: {
        slug: extension.slug,
        name: extension.name,
        description: extension.description,
        category: extension.category,
        publisherId: publisher.id,
        pricingType: extension.pricingType,
        priceCents: extension.priceCents,
        licenseType: extension.licenseType,
        screenshots: [...extension.screenshots],
        dependencies: [...extension.dependencies],
        permissionsRequired: [...extension.permissionsRequired],
        compatibility: {
          minBusalVersion: extension.minBusalVersion,
          requiredModules: extension.requiredModules,
          requiredIndustries: extension.requiredIndustries,
          requiresAi: extension.requiresAi,
        },
        status: "PUBLISHED",
      },
    });

    const version = await prisma.marketplaceItemVersion.create({
      data: {
        itemId: item.id,
        versionNumber: 1,
        versionLabel: extension.versionLabel,
        changelog: extension.changelog,
        minBusalVersion: extension.minBusalVersion,
        requiredModules: [...extension.requiredModules],
        requiredIndustries: [...extension.requiredIndustries],
        requiresAi: extension.requiresAi,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    await prisma.marketplaceItem.update({
      where: { id: item.id },
      data: { currentVersionId: version.id },
    });
  }
}

export async function listMarketplaceItems(category?: string) {
  await ensureMarketplaceCatalogue();

  return prisma.marketplaceItem.findMany({
    where: {
      status: "PUBLISHED",
      ...(category ? { category: category as never } : {}),
    },
    include: {
      publisher: true,
      currentVersion: { select: { versionLabel: true } },
    },
    orderBy: { downloadCount: "desc" },
  });
}

export async function listInstalledMarketplaceItems(businessId: string) {
  return prisma.marketplaceInstallation.findMany({
    where: { businessId, status: { in: ["INSTALLED", "ROLLED_BACK"] } },
    include: {
      item: true,
      version: { select: { versionLabel: true } },
    },
    orderBy: { installedAt: "desc" },
  });
}

export async function listMarketplaceInstallationHistory(businessId: string, limit = 50) {
  return prisma.marketplaceInstallationHistory.findMany({
    where: { businessId },
    include: { item: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listMarketplaceReviews(businessId: string, limit = 50) {
  return prisma.marketplaceReview.findMany({
    where: { businessId },
    include: { item: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listMarketplacePublishers() {
  await ensureMarketplaceCatalogue();

  return prisma.marketplacePublisher.findMany({
    where: { verified: true },
    orderBy: { totalDownloads: "desc" },
  });
}

async function ensureActiveLicense(
  platform: BusinessContext,
  itemId: string,
  licenseType: MarketplaceLicenseType,
): Promise<void> {
  const existing = await prisma.marketplaceLicense.findUnique({
    where: { businessId_itemId: { businessId: platform.business.id, itemId } },
  });

  if (existing && isLicenseActive(existing.expiresAt)) {
    return;
  }

  await prisma.marketplaceLicense.upsert({
    where: {
      businessId_itemId: {
        businessId: platform.business.id,
        itemId,
      },
    },
    create: {
      businessId: platform.business.id,
      itemId,
      licenseType,
      status: licenseType === "TRIAL" ? "TRIAL" : "ACTIVE",
      expiresAt: resolveLicenseExpiry(licenseType),
    },
    update: {
      licenseType,
      status: licenseType === "TRIAL" ? "TRIAL" : "ACTIVE",
      expiresAt: resolveLicenseExpiry(licenseType),
    },
  });
}

export async function purchaseMarketplaceItem(platform: BusinessContext, itemId: string) {
  assertPermission(platform, PERMISSION_CODES.MARKETPLACE_PURCHASE);

  const item = await prisma.marketplaceItem.findUnique({
    where: { id: itemId },
    include: { publisher: true },
  });

  if (!item) {
    throw new Error("Marketplace item not found");
  }

  if (item.pricingType === "PAID" && item.priceCents > 0) {
    const { commissionCents, revenueShareCents } = calculateRevenueSplit(
      item.priceCents,
      DEFAULT_MARKETPLACE_COMMISSION_RATE,
    );

    await prisma.marketplaceRevenueRecord.create({
      data: {
        businessId: platform.business.id,
        itemId: item.id,
        publisherId: item.publisherId,
        amountCents: item.priceCents,
        commissionCents,
        revenueShareCents,
        billingType:
          item.licenseType === "MONTHLY" || item.licenseType === "ANNUAL"
            ? "SUBSCRIPTION"
            : "ONE_TIME",
      },
    });

    await prisma.marketplacePublisher.update({
      where: { id: item.publisherId },
      data: {
        totalRevenueCents: { increment: revenueShareCents },
      },
    });
  }

  await ensureActiveLicense(platform, item.id, item.licenseType);

  await logMarketplaceAudit(
    platform.business.id,
    platform.staffSession?.staffId ?? null,
    "item",
    item.id,
    "purchased",
    { priceCents: item.priceCents },
  );

  return item;
}

export async function installMarketplaceItem(platform: BusinessContext, itemId: string) {
  assertPermission(platform, PERMISSION_CODES.MARKETPLACE_INSTALL);

  const item = await prisma.marketplaceItem.findUnique({
    where: { id: itemId },
    include: { currentVersion: true, publisher: true },
  });

  if (!item?.currentVersion) {
    throw new Error("Marketplace item not found");
  }

  if (item.pricingType === "PAID") {
    await purchaseMarketplaceItem(platform, itemId);
  } else {
    await ensureActiveLicense(platform, item.id, item.licenseType);
  }

  const context = buildCompatibilityContext(platform);
  context.installedDependencies = await buildInstallationDependencies().getInstalledSlugs(
    platform.business.id,
  );

  const result = await runInstallationAction(
    {
      businessId: platform.business.id,
      itemId: item.id,
      versionId: item.currentVersion.id,
      action: "INSTALL",
    },
    context,
    buildInstallationDependencies(),
  );

  await prisma.marketplaceItem.update({
    where: { id: item.id },
    data: { downloadCount: { increment: 1 } },
  });

  await prisma.marketplacePublisher.update({
    where: { id: item.publisherId },
    data: { totalDownloads: { increment: 1 } },
  });

  await logMarketplaceAudit(
    platform.business.id,
    platform.staffSession?.staffId ?? null,
    "installation",
    result.installationId,
    "installed",
    { itemId: item.id, versionId: item.currentVersion.id },
  );

  return result;
}

export async function updateMarketplaceInstallation(
  platform: BusinessContext,
  itemId: string,
  versionId: string,
) {
  assertPermission(platform, PERMISSION_CODES.MARKETPLACE_INSTALL);

  const context = buildCompatibilityContext(platform);
  context.installedDependencies = await buildInstallationDependencies().getInstalledSlugs(
    platform.business.id,
  );

  const result = await runInstallationAction(
    {
      businessId: platform.business.id,
      itemId,
      versionId,
      action: "UPDATE",
    },
    context,
    buildInstallationDependencies(),
  );

  await logMarketplaceAudit(
    platform.business.id,
    platform.staffSession?.staffId ?? null,
    "installation",
    result.installationId,
    "updated",
    { itemId, versionId },
  );

  return result;
}

export async function rollbackMarketplaceInstallation(platform: BusinessContext, itemId: string) {
  assertPermission(platform, PERMISSION_CODES.MARKETPLACE_INSTALL);

  const installation = await prisma.marketplaceInstallation.findUnique({
    where: {
      businessId_itemId: {
        businessId: platform.business.id,
        itemId,
      },
    },
  });

  if (!installation?.previousVersionId) {
    throw new Error("No previous version to rollback");
  }

  const context = buildCompatibilityContext(platform);
  context.installedDependencies = await buildInstallationDependencies().getInstalledSlugs(
    platform.business.id,
  );

  const result = await runInstallationAction(
    {
      businessId: platform.business.id,
      itemId,
      versionId: installation.previousVersionId,
      action: "ROLLBACK",
      fromVersionId: installation.versionId,
    },
    context,
    buildInstallationDependencies(),
  );

  await logMarketplaceAudit(
    platform.business.id,
    platform.staffSession?.staffId ?? null,
    "installation",
    result.installationId,
    "rolled_back",
    { itemId, versionId: installation.previousVersionId },
  );

  return result;
}

export async function uninstallMarketplaceItem(platform: BusinessContext, itemId: string) {
  assertPermission(platform, PERMISSION_CODES.MARKETPLACE_INSTALL);

  const installation = await prisma.marketplaceInstallation.findUnique({
    where: {
      businessId_itemId: {
        businessId: platform.business.id,
        itemId,
      },
    },
  });

  if (!installation) {
    throw new Error("Installation not found");
  }

  const context = buildCompatibilityContext(platform);

  const result = await runInstallationAction(
    {
      businessId: platform.business.id,
      itemId,
      versionId: installation.versionId,
      action: "UNINSTALL",
    },
    context,
    buildInstallationDependencies(),
  );

  await logMarketplaceAudit(
    platform.business.id,
    platform.staffSession?.staffId ?? null,
    "installation",
    result.installationId,
    "uninstalled",
    { itemId },
  );

  return result;
}

export async function submitMarketplaceReview(
  platform: BusinessContext,
  input: {
    itemId: string;
    rating: number;
    title?: string;
    content?: string;
  },
) {
  assertPermission(platform, PERMISSION_CODES.MARKETPLACE_VIEW);

  if (input.rating < 1 || input.rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const review = await prisma.marketplaceReview.upsert({
    where: {
      businessId_itemId: {
        businessId: platform.business.id,
        itemId: input.itemId,
      },
    },
    create: {
      businessId: platform.business.id,
      itemId: input.itemId,
      staffId: platform.staffSession?.staffId ?? null,
      rating: input.rating,
      title: input.title ?? null,
      content: input.content ?? null,
    },
    update: {
      rating: input.rating,
      title: input.title ?? null,
      content: input.content ?? null,
    },
  });

  const aggregates = await prisma.marketplaceReview.aggregate({
    where: { itemId: input.itemId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.marketplaceItem.update({
    where: { id: input.itemId },
    data: {
      averageRating: aggregates._avg.rating ?? 0,
      reviewCount: aggregates._count.rating,
    },
  });

  return review;
}

export async function reportMarketplaceIssue(
  platform: BusinessContext,
  input: {
    itemId: string;
    description: string;
    reviewId?: string;
  },
) {
  assertPermission(platform, PERMISSION_CODES.MARKETPLACE_VIEW);

  return prisma.marketplaceIssueReport.create({
    data: {
      businessId: platform.business.id,
      itemId: input.itemId,
      reviewId: input.reviewId ?? null,
      description: input.description,
    },
  });
}

export async function publishMarketplaceItemVersion(
  platform: BusinessContext,
  input: {
    itemId: string;
    versionLabel: string;
    changelog?: string;
    minBusalVersion?: string;
    requiredModules?: string[];
    requiresAi?: boolean;
  },
) {
  assertPermission(platform, PERMISSION_CODES.MARKETPLACE_PUBLISH);

  const item = await prisma.marketplaceItem.findUnique({
    where: { id: input.itemId },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });

  if (!item) {
    throw new Error("Item not found");
  }

  const nextVersionNumber = (item.versions[0]?.versionNumber ?? 0) + 1;

  const version = await prisma.marketplaceItemVersion.create({
    data: {
      itemId: item.id,
      versionNumber: nextVersionNumber,
      versionLabel: input.versionLabel,
      changelog: input.changelog ?? null,
      minBusalVersion: input.minBusalVersion ?? BUSAL_PLATFORM_VERSION,
      requiredModules: input.requiredModules ?? [],
      requiresAi: input.requiresAi ?? false,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  await prisma.marketplaceItem.update({
    where: { id: item.id },
    data: { currentVersionId: version.id, status: "PUBLISHED" },
  });

  await logMarketplaceAudit(
    platform.business.id,
    platform.staffSession?.staffId ?? null,
    "item",
    item.id,
    "published",
    { versionId: version.id },
  );

  return version;
}

export async function deprecateMarketplaceItem(platform: BusinessContext, itemId: string) {
  assertPermission(platform, PERMISSION_CODES.MARKETPLACE_PUBLISH);

  await prisma.marketplaceItem.update({
    where: { id: itemId },
    data: { status: "DEPRECATED" },
  });

  await prisma.marketplaceItemVersion.updateMany({
    where: { itemId, status: "PUBLISHED" },
    data: { status: "DEPRECATED", deprecatedAt: new Date() },
  });
}

export async function getMarketplaceDashboard(
  businessId: string,
): Promise<MarketplaceDashboardMetrics> {
  await ensureMarketplaceCatalogue();

  const [items, installations, reviews, revenue, publishers] = await Promise.all([
    prisma.marketplaceItem.count({ where: { status: "PUBLISHED" } }),
    prisma.marketplaceInstallation.count({
      where: { businessId, status: { in: ["INSTALLED", "ROLLED_BACK"] } },
    }),
    prisma.marketplaceReview.count({ where: { businessId } }),
    prisma.marketplaceRevenueRecord.aggregate({
      where: { businessId },
      _sum: { amountCents: true },
    }),
    prisma.marketplacePublisher.count({ where: { verified: true } }),
  ]);

  const catalogue = await prisma.marketplaceItem.findMany({
    where: { status: "PUBLISHED" },
    select: { pricingType: true, averageRating: true },
  });

  const freeItems = catalogue.filter((item) => item.pricingType === "FREE").length;
  const paidItems = catalogue.filter((item) => item.pricingType === "PAID").length;
  const averageRating =
    catalogue.length > 0
      ? catalogue.reduce((sum, item) => sum + item.averageRating, 0) / catalogue.length
      : 0;

  return {
    totalItems: items,
    installedCount: installations,
    freeItems,
    paidItems,
    totalReviews: reviews,
    averageRating,
    totalRevenueCents: revenue._sum.amountCents ?? 0,
    publisherCount: publishers,
  };
}

export async function getPublisherDashboard(
  publisherId: string,
): Promise<PublisherDashboardMetrics> {
  const publisher = await prisma.marketplacePublisher.findUnique({
    where: { id: publisherId },
  });

  if (!publisher) {
    throw new Error("Publisher not found");
  }

  const items = await prisma.marketplaceItem.findMany({
    where: { publisherId, status: "PUBLISHED" },
    select: { averageRating: true },
  });

  const averageRating =
    items.length > 0 ? items.reduce((sum, item) => sum + item.averageRating, 0) / items.length : 0;

  return {
    totalDownloads: publisher.totalDownloads,
    totalRevenueCents: publisher.totalRevenueCents,
    publishedItems: items.length,
    averageRating,
  };
}

export async function listMarketplaceRevenueRecords(businessId: string, limit = 50) {
  return prisma.marketplaceRevenueRecord.findMany({
    where: { businessId },
    include: { item: true, publisher: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listMarketplaceLicenses(businessId: string) {
  return prisma.marketplaceLicense.findMany({
    where: { businessId },
    include: { item: { include: { publisher: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMarketplaceItemBySlug(slug: string) {
  await ensureMarketplaceCatalogue();

  return prisma.marketplaceItem.findUnique({
    where: { slug },
    include: {
      publisher: true,
      currentVersion: true,
      versions: { orderBy: { versionNumber: "desc" } },
      reviews: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
}

export async function listPublisherMarketplaceItems(businessId: string) {
  const publisher = await prisma.marketplacePublisher.findFirst({
    where: { businessId },
  });

  if (!publisher) {
    return [];
  }

  return prisma.marketplaceItem.findMany({
    where: { publisherId: publisher.id },
    include: {
      publisher: true,
      currentVersion: { select: { versionLabel: true } },
      versions: { orderBy: { versionNumber: "desc" }, take: 5 },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listMarketplaceReviewsForItem(itemId: string, limit = 20) {
  return prisma.marketplaceReview.findMany({
    where: { itemId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export { ensureBootstrapMarketplacePlugins };
