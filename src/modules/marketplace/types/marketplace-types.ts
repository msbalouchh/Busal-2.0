import type {
  MarketplaceCategory,
  MarketplaceInstallAction,
  MarketplaceLicenseType,
  MarketplacePricingType,
} from "@prisma/client";

export interface MarketplaceExtensionDefinition {
  slug: string;
  name: string;
  description: string;
  category: MarketplaceCategory;
  publisherSlug: string;
  pricingType: MarketplacePricingType;
  priceCents: number;
  licenseType: MarketplaceLicenseType;
  screenshots: string[];
  dependencies: string[];
  permissionsRequired: string[];
  minBusalVersion: string;
  requiredModules: string[];
  requiredIndustries: string[];
  requiresAi: boolean;
  changelog: string;
  versionLabel: string;
}

export interface CompatibilityContext {
  busalVersion: string;
  installedModules: string[];
  industry: string | null;
  hasAiFeatures: boolean;
  installedDependencies: string[];
  permissions: string[];
}

export interface CompatibilityResult {
  compatible: boolean;
  errors: string[];
  warnings: string[];
}

export interface InstallationRequest {
  businessId: string;
  itemId: string;
  versionId: string;
  action: MarketplaceInstallAction;
  fromVersionId?: string | null;
}

export interface MarketplaceDashboardMetrics {
  totalItems: number;
  installedCount: number;
  freeItems: number;
  paidItems: number;
  totalReviews: number;
  averageRating: number;
  totalRevenueCents: number;
  publisherCount: number;
}

export interface PublisherDashboardMetrics {
  totalDownloads: number;
  totalRevenueCents: number;
  publishedItems: number;
  averageRating: number;
}

export interface RevenueShareConfig {
  commissionRate: number;
  publisherShareRate: number;
  supportsSubscription: boolean;
  supportsUsageBilling: boolean;
}
