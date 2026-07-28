import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeMarketplaceDashboard,
  serializeMarketplaceHistory,
  serializeMarketplaceInstallation,
  serializeMarketplaceItem,
  serializeMarketplacePublisher,
  serializeMarketplaceReview,
  serializePublisherDashboard,
} from "@/modules/marketplace/utils/marketplace-utils";
import {
  getMarketplaceDashboard,
  getPublisherDashboard,
  listInstalledMarketplaceItems,
  listMarketplaceInstallationHistory,
  listMarketplaceItems,
  listMarketplacePublishers,
  listMarketplaceReviews,
  listMarketplaceRevenueRecords,
} from "@/services/marketplace.service";

export const getMarketplaceOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.MARKETPLACE_VIEW });
  const dashboard = await getMarketplaceDashboard(context.business.id);

  return {
    context,
    dashboard: serializeMarketplaceDashboard(dashboard),
  };
});

export const getMarketplaceCatalogueContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.MARKETPLACE_VIEW });
  const items = await listMarketplaceItems();

  return {
    context,
    items: items.map(serializeMarketplaceItem),
  };
});

export const getMarketplaceInstalledContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.MARKETPLACE_VIEW });
  const installations = await listInstalledMarketplaceItems(context.business.id);

  return {
    context,
    installations: installations.map(serializeMarketplaceInstallation),
  };
});

export const getMarketplacePublishersContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.MARKETPLACE_VIEW });
  const publishers = await listMarketplacePublishers();

  const publisherDashboards = await Promise.all(
    publishers.map(async (publisher) => ({
      publisher: serializeMarketplacePublisher(publisher),
      dashboard: serializePublisherDashboard(await getPublisherDashboard(publisher.id)),
    })),
  );

  return {
    context,
    publishers: publisherDashboards,
  };
});

export const getMarketplaceReviewsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.MARKETPLACE_VIEW });
  const reviews = await listMarketplaceReviews(context.business.id, 100);

  return {
    context,
    reviews: reviews.map(serializeMarketplaceReview),
  };
});

export const getMarketplaceRevenueContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.MARKETPLACE_VIEW });
  const records = await listMarketplaceRevenueRecords(context.business.id, 100);

  return {
    context,
    records: records.map((record) => ({
      id: record.id,
      itemName: record.item.name,
      publisherName: record.publisher.name,
      amountCents: record.amountCents,
      commissionCents: record.commissionCents,
      revenueShareCents: record.revenueShareCents,
      billingType: record.billingType,
      createdAt: record.createdAt.toISOString(),
    })),
  };
});

export const getMarketplaceHistoryContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.MARKETPLACE_VIEW });
  const history = await listMarketplaceInstallationHistory(context.business.id, 100);

  return {
    context,
    history: history.map(serializeMarketplaceHistory),
  };
});
