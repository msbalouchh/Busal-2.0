import type {
  PlatformMarketplaceAppStatus,
  PlatformMarketplaceInstallStatus,
  PlatformMarketplacePricingModel,
} from "@prisma/client";

export interface MarketplaceAppRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  developer: string;
  category: string;
  currentVersion: string;
  status: PlatformMarketplaceAppStatus;
  pricingModel: PlatformMarketplacePricingModel;
  reviewCount: number;
  installCount: number;
  versionCount: number;
  createdAt: string;
}

export interface InstalledAppRecord {
  id: string;
  appId: string;
  appName: string;
  appSlug: string;
  version: string;
  status: PlatformMarketplaceInstallStatus;
  category: string;
  installedAt: string;
  updatedAt: string;
}

export interface AppReviewRecord {
  id: string;
  appId: string;
  appName?: string;
  rating: number;
  review: string;
  createdAt: string;
}

export interface MarketplaceSummaryRecord {
  totalApps: number;
  categories: Array<{ category: string; count: number }>;
  installed: number;
  disabled: number;
  pending: number;
  failed: number;
  pendingUpdates: number;
}

export interface AppUpdateRecord {
  id: string;
  appName: string;
  currentVersion: string;
  latestVersion: string;
}
