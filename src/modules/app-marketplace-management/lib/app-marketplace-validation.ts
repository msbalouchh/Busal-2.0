import type {
  PlatformInstalledApp,
  PlatformMarketplaceApp,
  PlatformMarketplaceAppReview,
} from "@prisma/client";

import type {
  AppReviewRecord,
  AppUpdateRecord,
  InstalledAppRecord,
  MarketplaceAppRecord,
  MarketplaceSummaryRecord,
} from "@/modules/app-marketplace-management/types/app-marketplace-types";
import type { getMarketplaceManagerOverview } from "@/services/marketplace-manager.service";

export function serializeMarketplaceApp(
  app: PlatformMarketplaceApp & {
    _count?: { reviews: number; installedApps: number; versions: number };
  },
): MarketplaceAppRecord {
  return {
    id: app.id,
    name: app.name,
    slug: app.slug,
    description: app.description,
    developer: app.developer,
    category: app.category,
    currentVersion: app.currentVersion,
    status: app.status,
    pricingModel: app.pricingModel,
    reviewCount: app._count?.reviews ?? 0,
    installCount: app._count?.installedApps ?? 0,
    versionCount: app._count?.versions ?? 0,
    createdAt: app.createdAt.toISOString(),
  };
}

export function serializeInstalledApp(
  installed: PlatformInstalledApp & { app: PlatformMarketplaceApp },
): InstalledAppRecord {
  return {
    id: installed.id,
    appId: installed.appId,
    appName: installed.app.name,
    appSlug: installed.app.slug,
    version: installed.version,
    status: installed.status,
    category: installed.app.category,
    installedAt: installed.installedAt.toISOString(),
    updatedAt: installed.updatedAt.toISOString(),
  };
}

export function serializeAppReview(
  review: PlatformMarketplaceAppReview & { app?: { name: string } },
): AppReviewRecord {
  return {
    id: review.id,
    appId: review.appId,
    appName: review.app?.name,
    rating: review.rating,
    review: review.review,
    createdAt: review.createdAt.toISOString(),
  };
}

export function serializeMarketplaceSummary(
  overview: Awaited<ReturnType<typeof getMarketplaceManagerOverview>>,
): MarketplaceSummaryRecord {
  return {
    totalApps: overview.catalog.totalApps,
    categories: overview.catalog.categories,
    installed: overview.installed.installed,
    disabled: overview.installed.disabled,
    pending: overview.installed.pending,
    failed: overview.installed.failed,
    pendingUpdates: overview.pendingUpdates,
  };
}

export function serializeAppUpdate(
  installed: PlatformInstalledApp & { app: PlatformMarketplaceApp },
): AppUpdateRecord {
  return {
    id: installed.id,
    appName: installed.app.name,
    currentVersion: installed.version,
    latestVersion: installed.app.currentVersion,
  };
}
