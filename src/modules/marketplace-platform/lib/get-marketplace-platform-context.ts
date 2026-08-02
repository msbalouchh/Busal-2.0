import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import type { MarketplaceCatalogQuery } from "@/modules/marketplace-platform/types/marketplace-platform-types";
import {
  serializeMarketplaceHistory,
  serializeMarketplaceInstallation,
  serializeMarketplaceItem,
  serializeMarketplaceReview,
} from "@/modules/marketplace/utils/marketplace-utils";
import {
  getMarketplacePlatformBundle,
  getMarketplaceProductDetail,
  getMarketplaceLicensesForPlatform,
  getPublisherPortalBundle,
  queryMarketplaceCatalog,
} from "@/services/marketplace-platform-module.service";
import {
  listMarketplaceInstallationHistory,
  listMarketplaceItems,
  listInstalledMarketplaceItems,
  listMarketplaceReviews,
} from "@/services/marketplace.service";

export const getMarketplacePlatformContext = cache(async () => {
  const platform = await protectedPage();
  const bundle = await getMarketplacePlatformBundle(platform);

  return {
    platform,
    ...bundle,
  };
});

export const getMarketplacePlatformCatalogContext = cache(
  async (query: MarketplaceCatalogQuery = {}) => {
    const platform = await protectedPage({ permission: PERMISSION_CODES.MARKETPLACE_VIEW });
    const [bundle, catalog] = await Promise.all([
      getMarketplacePlatformBundle(platform),
      queryMarketplaceCatalog(query),
    ]);

    return {
      platform,
      permissions: bundle.permissions,
      catalog,
    };
  },
);

export const getMarketplacePlatformProductContext = cache(async (slug: string) => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.MARKETPLACE_VIEW });
  const [bundle, product] = await Promise.all([
    getMarketplacePlatformBundle(platform),
    getMarketplaceProductDetail(platform, slug),
  ]);

  return {
    platform,
    permissions: bundle.permissions,
    product,
  };
});

export const getMarketplacePlatformInstallationsContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.MARKETPLACE_VIEW });
  const [bundle, installations, history] = await Promise.all([
    getMarketplacePlatformBundle(platform),
    listInstalledMarketplaceItems(platform.business.id),
    listMarketplaceInstallationHistory(platform.business.id, 50),
  ]);

  return {
    platform,
    permissions: bundle.permissions,
    installations: installations.map(serializeMarketplaceInstallation),
    history: history.map(serializeMarketplaceHistory),
  };
});

export const getMarketplacePlatformAgentsContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.MARKETPLACE_VIEW });
  const [bundle, agentsRaw, installations] = await Promise.all([
    getMarketplacePlatformBundle(platform),
    listMarketplaceItems("AI_AGENTS"),
    listInstalledMarketplaceItems(platform.business.id),
  ]);

  const agents = agentsRaw.map(serializeMarketplaceItem);
  const installedAgents = installations
    .filter((entry) => entry.item.category === "AI_AGENTS")
    .map((entry) => ({
      id: entry.item.id,
      slug: entry.item.slug,
      name: entry.item.name,
      description: entry.item.description,
      category: entry.item.category,
      publisherName:
        agents.find((agent) => agent.id === entry.item.id)?.publisherName ?? "Publisher",
      pricingType: entry.item.pricingType,
      priceCents: entry.item.priceCents,
      licenseType: entry.item.licenseType,
      averageRating: entry.item.averageRating,
      reviewCount: entry.item.reviewCount,
      downloadCount: entry.item.downloadCount,
      versionLabel: entry.version.versionLabel,
      status: entry.item.status,
    }));

  return {
    platform,
    permissions: bundle.permissions,
    agents,
    installations: installedAgents,
  };
});

export const getMarketplacePlatformLicensesContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.MARKETPLACE_VIEW });
  const [bundle, licenses] = await Promise.all([
    getMarketplacePlatformBundle(platform),
    getMarketplaceLicensesForPlatform(platform),
  ]);

  return {
    platform,
    permissions: bundle.permissions,
    licenses,
    widgets: bundle.widgets,
  };
});

export const getMarketplacePlatformPublisherContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.MARKETPLACE_VIEW });
  const bundle = await getMarketplacePlatformBundle(platform);
  const portal = bundle.permissions.canViewPublisherPortal
    ? await getPublisherPortalBundle(platform)
    : { publisher: null, items: [], dashboard: null };

  return {
    platform,
    permissions: bundle.permissions,
    portal,
  };
});

export const getMarketplacePlatformAnalyticsContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.MARKETPLACE_VIEW });
  const [bundle, reviews] = await Promise.all([
    getMarketplacePlatformBundle(platform),
    listMarketplaceReviews(platform.business.id, 20),
  ]);

  return {
    platform,
    permissions: bundle.permissions,
    analytics: bundle.analytics,
    widgets: bundle.widgets,
    reviews: reviews.map(serializeMarketplaceReview),
  };
});

export const getMarketplacePlatformModuleContext = getMarketplacePlatformContext;
