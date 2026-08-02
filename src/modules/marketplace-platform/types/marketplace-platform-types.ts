import type { MarketplaceItemView } from "@/modules/marketplace/utils/marketplace-utils";

export interface MarketplacePlatformPermissions {
  canViewMarketplace: boolean;
  canInstall: boolean;
  canPurchase: boolean;
  canPublish: boolean;
  canAdmin: boolean;
  canManageLicenses: boolean;
  canViewPublisherPortal: boolean;
  canViewAnalytics: boolean;
}

export interface MarketplaceHomeWidgets {
  totalItems: number;
  installedCount: number;
  activeLicenses: number;
  expiringLicenses: number;
  totalDownloads: number;
  averageRating: number;
  totalRevenueCents: number;
  publisherCount: number;
}

export interface MarketplaceHomeSection {
  key: string;
  label: string;
  items: MarketplaceItemView[];
}

export interface MarketplaceCatalogQuery {
  search?: string;
  category?: string;
  pricing?: "FREE" | "PAID";
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface MarketplaceCatalogResult {
  items: MarketplaceItemView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  categories: string[];
}

export interface MarketplaceProductDetailView {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  publisherName: string;
  publisherVerified: boolean;
  publisherDescription: string | null;
  pricingType: string;
  priceCents: number;
  licenseType: string;
  averageRating: number;
  reviewCount: number;
  downloadCount: number;
  versionLabel: string | null;
  changelog: string | null;
  screenshots: string[];
  dependencies: string[];
  permissionsRequired: string[];
  compatibility: Record<string, unknown> | null;
  versions: Array<{
    id: string;
    versionLabel: string;
    versionNumber: number;
    changelog: string | null;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    title: string | null;
    content: string | null;
    createdAt: string;
  }>;
  isInstalled: boolean;
  installationStatus: string | null;
}

export interface MarketplaceLicenseView {
  id: string;
  itemName: string;
  itemSlug: string;
  licenseType: string;
  status: string;
  expiresAt: string | null;
  isExpiringSoon: boolean;
}

export interface MarketplaceAnalyticsSnapshot {
  totalDownloads: number;
  activeInstallations: number;
  totalRevenueCents: number;
  averageRating: number;
  totalReviews: number;
  freeItems: number;
  paidItems: number;
  categoryBreakdown: Array<{ category: string; count: number }>;
}

export interface MarketplacePlatformBundle {
  permissions: MarketplacePlatformPermissions;
  widgets: MarketplaceHomeWidgets;
  homeSections: MarketplaceHomeSection[];
  recentlyInstalled: MarketplaceItemView[];
  recommended: MarketplaceItemView[];
  registeredExtensionCount: number;
  dashboard: {
    totalItems: number;
    installedCount: number;
    freeItems: number;
    paidItems: number;
    totalReviews: number;
    averageRating: number;
    totalRevenueCents: number;
    publisherCount: number;
  } | null;
  analytics: MarketplaceAnalyticsSnapshot | null;
}

export interface PublisherPortalView {
  publisher: {
    id: string;
    name: string;
    slug: string;
    verified: boolean;
  } | null;
  items: MarketplaceItemView[];
  dashboard: {
    totalDownloads: number;
    totalRevenueCents: number;
    publishedItems: number;
    averageRating: number;
  } | null;
}
