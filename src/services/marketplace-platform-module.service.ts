import "server-only";

import { prisma } from "@/lib/prisma";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import {
  MARKETPLACE_CATALOG_PAGE_SIZE,
  MARKETPLACE_HOME_SECTIONS,
} from "@/modules/marketplace-platform/constants/marketplace-platform";
import type {
  MarketplaceAnalyticsSnapshot,
  MarketplaceCatalogQuery,
  MarketplaceCatalogResult,
  MarketplaceHomeSection,
  MarketplaceLicenseView,
  MarketplacePlatformBundle,
  MarketplacePlatformPermissions,
  MarketplaceProductDetailView,
  PublisherPortalView,
} from "@/modules/marketplace-platform/types/marketplace-platform-types";
import { MARKETPLACE_CATEGORIES } from "@/modules/marketplace/constants/routes";
import { isLicenseActive } from "@/modules/marketplace/engine/licensing-engine";
import { listMarketplaceExtensions } from "@/modules/marketplace/registry/marketplace-registry";
import {
  serializeMarketplaceItem,
  type MarketplaceItemView,
} from "@/modules/marketplace/utils/marketplace-utils";
import {
  getMarketplaceDashboard,
  getMarketplaceItemBySlug,
  getPublisherDashboard,
  listInstalledMarketplaceItems,
  listMarketplaceItems,
  listMarketplaceLicenses,
  listPublisherMarketplaceItems,
} from "@/services/marketplace.service";

function buildPermissions(platform: BusinessContext): MarketplacePlatformPermissions {
  const permissions = platform.authorization.permissions;

  return {
    canViewMarketplace:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.MARKETPLACE_VIEW),
    canInstall:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.MARKETPLACE_INSTALL),
    canPurchase:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.MARKETPLACE_PURCHASE),
    canPublish:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.MARKETPLACE_PUBLISH),
    canAdmin: platform.isOwner || hasPermission(permissions, PERMISSION_CODES.MARKETPLACE_ADMIN),
    canManageLicenses:
      platform.isOwner ||
      hasPermission(permissions, PERMISSION_CODES.MARKETPLACE_PURCHASE) ||
      hasPermission(permissions, PERMISSION_CODES.MARKETPLACE_INSTALL),
    canViewPublisherPortal:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.MARKETPLACE_PUBLISH),
    canViewAnalytics:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.MARKETPLACE_VIEW),
  };
}

function sortCatalogItems(items: MarketplaceItemView[], sort: string): MarketplaceItemView[] {
  const sorted = [...items];

  switch (sort) {
    case "rating":
      return sorted.sort((left, right) => right.averageRating - left.averageRating);
    case "downloads":
      return sorted.sort((left, right) => right.downloadCount - left.downloadCount);
    case "name":
      return sorted.sort((left, right) => left.name.localeCompare(right.name));
    case "price_asc":
      return sorted.sort((left, right) => left.priceCents - right.priceCents);
    case "price_desc":
      return sorted.sort((left, right) => right.priceCents - left.priceCents);
    case "featured":
    default:
      return sorted.sort((left, right) => right.downloadCount - left.downloadCount);
  }
}

function buildHomeSections(items: MarketplaceItemView[]): MarketplaceHomeSection[] {
  return MARKETPLACE_HOME_SECTIONS.map((section) => ({
    key: section.key,
    label: section.label,
    items: items.filter((item) => section.categories.includes(item.category as never)).slice(0, 6),
  })).filter((section) => section.items.length > 0);
}

function buildRecommendedItems(
  catalogue: MarketplaceItemView[],
  installedSlugs: Set<string>,
): MarketplaceItemView[] {
  return catalogue
    .filter((item) => !installedSlugs.has(item.slug))
    .sort((left, right) => {
      const leftScore = left.averageRating * 10 + left.downloadCount * 0.01;
      const rightScore = right.averageRating * 10 + right.downloadCount * 0.01;
      return rightScore - leftScore;
    })
    .slice(0, 8);
}

async function buildAnalyticsSnapshot(businessId: string): Promise<MarketplaceAnalyticsSnapshot> {
  const [dashboard, installations, catalogue] = await Promise.all([
    getMarketplaceDashboard(businessId),
    listInstalledMarketplaceItems(businessId),
    listMarketplaceItems(),
  ]);

  const categoryMap = new Map<string, number>();
  for (const item of catalogue) {
    categoryMap.set(item.category, (categoryMap.get(item.category) ?? 0) + 1);
  }

  return {
    totalDownloads: catalogue.reduce((sum, item) => sum + item.downloadCount, 0),
    activeInstallations: installations.filter((entry) => entry.status === "INSTALLED").length,
    totalRevenueCents: dashboard.totalRevenueCents,
    averageRating: dashboard.averageRating,
    totalReviews: dashboard.totalReviews,
    freeItems: dashboard.freeItems,
    paidItems: dashboard.paidItems,
    categoryBreakdown: [...categoryMap.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((left, right) => right.count - left.count),
  };
}

function buildLicenseViews(licenses: Awaited<ReturnType<typeof listMarketplaceLicenses>>): {
  views: MarketplaceLicenseView[];
  activeCount: number;
  expiringCount: number;
} {
  const now = Date.now();
  const expiringThresholdMs = 1000 * 60 * 60 * 24 * 30;

  const views = licenses.map((license) => {
    const expiresAt = license.expiresAt?.toISOString() ?? null;
    const isExpiringSoon =
      license.expiresAt != null &&
      license.expiresAt.getTime() > now &&
      license.expiresAt.getTime() - now <= expiringThresholdMs;

    return {
      id: license.id,
      itemName: license.item.name,
      itemSlug: license.item.slug,
      licenseType: license.licenseType,
      status: license.status,
      expiresAt,
      isExpiringSoon,
    };
  });

  return {
    views,
    activeCount: views.filter((license) =>
      isLicenseActive(license.expiresAt ? new Date(license.expiresAt) : null),
    ).length,
    expiringCount: views.filter((license) => license.isExpiringSoon).length,
  };
}

export async function queryMarketplaceCatalog(
  query: MarketplaceCatalogQuery = {},
): Promise<MarketplaceCatalogResult> {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? MARKETPLACE_CATALOG_PAGE_SIZE;
  const allItems = (await listMarketplaceItems()).map(serializeMarketplaceItem);

  const filtered = allItems.filter((item) => {
    const matchesSearch =
      !query.search?.trim() ||
      item.name.toLowerCase().includes(query.search.trim().toLowerCase()) ||
      (item.description ?? "").toLowerCase().includes(query.search.trim().toLowerCase()) ||
      item.publisherName.toLowerCase().includes(query.search.trim().toLowerCase());
    const matchesCategory = !query.category || item.category === query.category;
    const matchesPricing = !query.pricing || item.pricingType === query.pricing;

    return matchesSearch && matchesCategory && matchesPricing;
  });

  const sorted = sortCatalogItems(filtered, query.sort ?? "featured");
  const total = sorted.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const start = (page - 1) * pageSize;

  return {
    items: sorted.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
    categories: [...MARKETPLACE_CATEGORIES],
  };
}

export async function getMarketplaceProductDetail(
  platform: BusinessContext,
  slug: string,
): Promise<MarketplaceProductDetailView | null> {
  const item = await getMarketplaceItemBySlug(slug);
  if (!item) {
    return null;
  }

  const installation = await prisma.marketplaceInstallation.findUnique({
    where: {
      businessId_itemId: {
        businessId: platform.business.id,
        itemId: item.id,
      },
    },
    select: { status: true },
  });

  const compatibility =
    item.compatibility && typeof item.compatibility === "object"
      ? (item.compatibility as Record<string, unknown>)
      : null;

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    description: item.description,
    category: item.category,
    publisherName: item.publisher.name,
    publisherVerified: item.publisher.verified,
    publisherDescription: item.publisher.description,
    pricingType: item.pricingType,
    priceCents: item.priceCents,
    licenseType: item.licenseType,
    averageRating: item.averageRating,
    reviewCount: item.reviewCount,
    downloadCount: item.downloadCount,
    versionLabel: item.currentVersion?.versionLabel ?? null,
    changelog: item.currentVersion?.changelog ?? null,
    screenshots: item.screenshots,
    dependencies: item.dependencies,
    permissionsRequired: item.permissionsRequired,
    compatibility,
    versions: item.versions.map((version) => ({
      id: version.id,
      versionLabel: version.versionLabel,
      versionNumber: version.versionNumber,
      changelog: version.changelog,
    })),
    reviews: item.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      content: review.content,
      createdAt: review.createdAt.toISOString(),
    })),
    isInstalled: installation?.status === "INSTALLED" || installation?.status === "ROLLED_BACK",
    installationStatus: installation?.status ?? null,
  };
}

export async function getMarketplacePlatformBundle(
  platform: BusinessContext,
): Promise<MarketplacePlatformBundle> {
  const permissions = buildPermissions(platform);
  const businessId = platform.business.id;

  const [dashboard, catalogueRaw, installations, licenses, analytics] = await Promise.all([
    permissions.canViewMarketplace ? getMarketplaceDashboard(businessId) : Promise.resolve(null),
    permissions.canViewMarketplace ? listMarketplaceItems() : Promise.resolve([]),
    permissions.canViewMarketplace
      ? listInstalledMarketplaceItems(businessId)
      : Promise.resolve([]),
    permissions.canManageLicenses ? listMarketplaceLicenses(businessId) : Promise.resolve([]),
    permissions.canViewAnalytics ? buildAnalyticsSnapshot(businessId) : Promise.resolve(null),
  ]);

  const catalogue = catalogueRaw.map(serializeMarketplaceItem);
  const catalogueById = new Map(catalogue.map((item) => [item.id, item]));
  const installedSlugs = new Set(installations.map((entry) => entry.item.slug));
  const licenseSummary = buildLicenseViews(licenses);

  const recentlyInstalledViews: MarketplaceItemView[] = installations.slice(0, 6).map((entry) => {
    const catalogueItem = catalogueById.get(entry.item.id);
    if (catalogueItem) {
      return {
        ...catalogueItem,
        versionLabel: entry.version.versionLabel,
      };
    }

    return {
      id: entry.item.id,
      slug: entry.item.slug,
      name: entry.item.name,
      description: entry.item.description,
      category: entry.item.category,
      publisherName: "Publisher",
      pricingType: entry.item.pricingType,
      priceCents: entry.item.priceCents,
      licenseType: entry.item.licenseType,
      averageRating: entry.item.averageRating,
      reviewCount: entry.item.reviewCount,
      downloadCount: entry.item.downloadCount,
      versionLabel: entry.version.versionLabel,
      status: entry.item.status,
    };
  });

  return {
    permissions,
    widgets: {
      totalItems: dashboard?.totalItems ?? 0,
      installedCount: dashboard?.installedCount ?? 0,
      activeLicenses: licenseSummary.activeCount,
      expiringLicenses: licenseSummary.expiringCount,
      totalDownloads: analytics?.totalDownloads ?? 0,
      averageRating: dashboard?.averageRating ?? 0,
      totalRevenueCents: dashboard?.totalRevenueCents ?? 0,
      publisherCount: dashboard?.publisherCount ?? 0,
    },
    homeSections: buildHomeSections(catalogue),
    recentlyInstalled: recentlyInstalledViews,
    recommended: buildRecommendedItems(catalogue, installedSlugs),
    registeredExtensionCount: listMarketplaceExtensions().length,
    dashboard,
    analytics,
  };
}

export async function getPublisherPortalBundle(
  platform: BusinessContext,
): Promise<PublisherPortalView> {
  const publisher = await prisma.marketplacePublisher.findFirst({
    where: { businessId: platform.business.id },
  });

  if (!publisher) {
    return { publisher: null, items: [], dashboard: null };
  }

  const [items, dashboard] = await Promise.all([
    listPublisherMarketplaceItems(platform.business.id),
    getPublisherDashboard(publisher.id),
  ]);

  return {
    publisher: {
      id: publisher.id,
      name: publisher.name,
      slug: publisher.slug,
      verified: publisher.verified,
    },
    items: items.map(serializeMarketplaceItem),
    dashboard,
  };
}

export async function getMarketplaceLicensesForPlatform(
  platform: BusinessContext,
): Promise<MarketplaceLicenseView[]> {
  const licenses = await listMarketplaceLicenses(platform.business.id);
  return buildLicenseViews(licenses).views;
}

export async function getMarketplacePlatformCatalogCount(): Promise<number> {
  const items = await listMarketplaceItems();
  return items.length;
}
