import type {
  MarketplaceCategory,
  MarketplaceItemStatus,
  MarketplaceLicenseStatus,
  MarketplaceLicenseType,
} from "@prisma/client";

export interface ControlCenterMarketplacePermissions {
  canViewMarketplace: boolean;
  canManageCatalog: boolean;
  canManagePublishers: boolean;
  canManageReviews: boolean;
  canManageLicenses: boolean;
  canModerate: boolean;
  canViewAnalytics: boolean;
}

export interface ControlCenterMarketplaceDashboardWidgets {
  totalApps: number;
  totalAiAgents: number;
  totalPlugins: number;
  activeInstallations: number;
  revenueCents: number;
  totalDownloads: number;
  averageRating: number;
  pendingReviews: number;
  publisherCount: number;
}

export interface ControlCenterMarketplaceActivityItem {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

export interface ControlCenterCatalogItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: MarketplaceCategory;
  publisherId: string;
  publisherName: string;
  pricingType: string;
  priceCents: number;
  licenseType: MarketplaceLicenseType;
  averageRating: number;
  reviewCount: number;
  downloadCount: number;
  versionLabel: string | null;
  status: MarketplaceItemStatus;
  featured: boolean;
  adminHidden: boolean;
  createdAt: string;
}

export interface ControlCenterCatalogQuery {
  search?: string;
  category?: MarketplaceCategory | null;
  status?: MarketplaceItemStatus | null;
  featured?: boolean | null;
  page?: number;
  pageSize?: number;
}

export interface ControlCenterCatalogResult {
  items: ControlCenterCatalogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ControlCenterPublisherDirectoryItem {
  id: string;
  slug: string;
  name: string;
  contactEmail: string | null;
  verified: boolean;
  suspended: boolean;
  totalDownloads: number;
  totalRevenueCents: number;
  publishedPackages: number;
  averageRating: number;
  createdAt: string;
}

export interface ControlCenterPublisherQuery {
  search?: string;
  verified?: boolean | null;
  suspended?: boolean | null;
  page?: number;
  pageSize?: number;
}

export interface ControlCenterPublisherDirectoryResult {
  items: ControlCenterPublisherDirectoryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ControlCenterLicenseItem {
  id: string;
  businessId: string;
  businessName: string;
  itemId: string;
  itemName: string;
  licenseType: MarketplaceLicenseType;
  status: MarketplaceLicenseStatus;
  seatsUsed: number;
  seatsTotal: number;
  startsAt: string;
  expiresAt: string | null;
  renewalDue: boolean;
}

export interface ControlCenterLicenseQuery {
  search?: string;
  status?: MarketplaceLicenseStatus | null;
  licenseType?: MarketplaceLicenseType | null;
  page?: number;
  pageSize?: number;
}

export interface ControlCenterLicenseDirectoryResult {
  items: ControlCenterLicenseItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    active: number;
    expired: number;
    trial: number;
    enterprise: number;
    renewalsDue: number;
  };
}

export interface ControlCenterPendingReviewItem {
  id: string;
  name: string;
  publisherName: string;
  category: MarketplaceCategory;
  versionLabel: string | null;
  submittedAt: string;
  securityReviewPassed: boolean;
  compatibilityReviewPassed: boolean;
  reviewNotes: string | null;
}

export interface ControlCenterIssueReportItem {
  id: string;
  itemId: string;
  itemName: string;
  businessId: string;
  businessName: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface ControlCenterIssueReportQuery {
  status?: string | null;
  page?: number;
  pageSize?: number;
}

export interface ControlCenterIssueReportResult {
  items: ControlCenterIssueReportItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ControlCenterMarketplaceAnalytics {
  downloadTrends: Array<{ month: string; downloads: number }>;
  installationTrends: Array<{ month: string; installations: number }>;
  revenueTrends: Array<{ month: string; revenueCents: number }>;
  ratingTrends: Array<{ month: string; averageRating: number }>;
  categoryBreakdown: Array<{ category: string; count: number }>;
  topPackages: Array<{ itemId: string; name: string; downloads: number; revenueCents: number }>;
  agentPerformance: Array<{
    itemId: string;
    name: string;
    installations: number;
    averageRating: number;
  }>;
}

export interface ControlCenterMarketplaceManagementBundle {
  widgets: ControlCenterMarketplaceDashboardWidgets;
  permissions: ControlCenterMarketplacePermissions;
  recentActivity: ControlCenterMarketplaceActivityItem[];
  catalog: ControlCenterCatalogResult;
  publishers: ControlCenterPublisherDirectoryResult;
  licenses: ControlCenterLicenseDirectoryResult;
  pendingReviews: ControlCenterPendingReviewItem[];
  issueReports: ControlCenterIssueReportResult;
  analytics: ControlCenterMarketplaceAnalytics;
  featuredAgents: ControlCenterCatalogItem[];
}

export interface ControlCenterMarketplaceItemDetail {
  item: ControlCenterCatalogItem;
  versions: Array<{
    id: string;
    versionLabel: string;
    versionNumber: number;
    status: MarketplaceItemStatus;
    publishedAt: string | null;
    minBusalVersion: string | null;
    requiresAi: boolean;
  }>;
  installations: number;
  revenueCents: number;
}

export interface ControlCenterPublisherDetail {
  publisher: ControlCenterPublisherDirectoryItem;
  packages: ControlCenterCatalogItem[];
  revenueCents: number;
  totalDownloads: number;
}

export interface ControlCenterPackageReviewInput {
  itemId: string;
  securityReviewPassed?: boolean;
  compatibilityReviewPassed?: boolean;
  reviewNotes?: string;
}
