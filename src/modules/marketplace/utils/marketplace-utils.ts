import type {
  MarketplaceInstallation,
  MarketplaceInstallationHistory,
  MarketplaceItem,
  MarketplaceLicense,
  MarketplacePublisher,
  MarketplaceReview,
} from "@prisma/client";

import type {
  MarketplaceDashboardMetrics,
  PublisherDashboardMetrics,
} from "@/modules/marketplace/types/marketplace-types";

export interface MarketplaceItemView {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: MarketplaceItem["category"];
  publisherName: string;
  pricingType: MarketplaceItem["pricingType"];
  priceCents: number;
  licenseType: MarketplaceItem["licenseType"];
  averageRating: number;
  reviewCount: number;
  downloadCount: number;
  versionLabel: string | null;
  status: MarketplaceItem["status"];
}

export interface MarketplaceInstallationView {
  id: string;
  itemName: string;
  itemSlug: string;
  versionLabel: string | null;
  status: MarketplaceInstallation["status"];
  installedAt: string;
}

export interface MarketplaceHistoryView {
  id: string;
  itemName: string;
  action: MarketplaceInstallationHistory["action"];
  status: MarketplaceInstallationHistory["status"];
  createdAt: string;
}

export interface MarketplaceReviewView {
  id: string;
  itemName: string;
  rating: number;
  title: string | null;
  content: string | null;
  createdAt: string;
}

export type MarketplaceDashboardView = MarketplaceDashboardMetrics;
export type PublisherDashboardView = PublisherDashboardMetrics;

export function serializeMarketplaceItem(
  item: MarketplaceItem & {
    publisher: MarketplacePublisher;
    currentVersion?: { versionLabel: string } | null;
  },
): MarketplaceItemView {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    description: item.description,
    category: item.category,
    publisherName: item.publisher.name,
    pricingType: item.pricingType,
    priceCents: item.priceCents,
    licenseType: item.licenseType,
    averageRating: item.averageRating,
    reviewCount: item.reviewCount,
    downloadCount: item.downloadCount,
    versionLabel: item.currentVersion?.versionLabel ?? null,
    status: item.status,
  };
}

export function serializeMarketplaceInstallation(
  installation: MarketplaceInstallation & {
    item: MarketplaceItem;
    version: { versionLabel: string };
  },
): MarketplaceInstallationView {
  return {
    id: installation.id,
    itemName: installation.item.name,
    itemSlug: installation.item.slug,
    versionLabel: installation.version.versionLabel,
    status: installation.status,
    installedAt: installation.installedAt.toISOString(),
  };
}

export function serializeMarketplaceHistory(
  history: MarketplaceInstallationHistory & { item: MarketplaceItem },
): MarketplaceHistoryView {
  return {
    id: history.id,
    itemName: history.item.name,
    action: history.action,
    status: history.status,
    createdAt: history.createdAt.toISOString(),
  };
}

export function serializeMarketplaceReview(
  review: MarketplaceReview & { item: MarketplaceItem },
): MarketplaceReviewView {
  return {
    id: review.id,
    itemName: review.item.name,
    rating: review.rating,
    title: review.title,
    content: review.content,
    createdAt: review.createdAt.toISOString(),
  };
}

export function serializeMarketplacePublisher(publisher: MarketplacePublisher) {
  return {
    id: publisher.id,
    slug: publisher.slug,
    name: publisher.name,
    verified: publisher.verified,
    totalDownloads: publisher.totalDownloads,
    totalRevenueCents: publisher.totalRevenueCents,
  };
}

export function serializeMarketplaceLicense(
  license: MarketplaceLicense & { item: MarketplaceItem },
) {
  return {
    id: license.id,
    itemName: license.item.name,
    licenseType: license.licenseType,
    status: license.status,
    expiresAt: license.expiresAt?.toISOString() ?? null,
  };
}

export function serializeMarketplaceDashboard(
  metrics: MarketplaceDashboardMetrics,
): MarketplaceDashboardView {
  return metrics;
}

export function serializePublisherDashboard(
  metrics: PublisherDashboardMetrics,
): PublisherDashboardView {
  return metrics;
}
