import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import { serializeCommercialDashboard } from "@/modules/commercial/utils/commercial-utils";
import {
  getCommercialCatalogueDashboard,
  listCommercialBundles,
  listCommercialCategories,
  listCommercialProducts,
  listPriceBooks,
} from "@/services/commercial-catalogue.service";

export const getCommercialOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.COMMERCIAL_VIEW });
  const dashboard = await getCommercialCatalogueDashboard(context.business.id);

  return {
    context,
    dashboard: serializeCommercialDashboard(dashboard),
  };
});

export const getCommercialCategoriesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.COMMERCIAL_VIEW });
  const categories = await listCommercialCategories(context.business.id);

  return { context, categories };
});

export const getCommercialProductsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.COMMERCIAL_VIEW });
  const [products, categories] = await Promise.all([
    listCommercialProducts(context.business.id),
    listCommercialCategories(context.business.id),
  ]);

  return { context, products, categories };
});

export const getCommercialBundlesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.COMMERCIAL_VIEW });
  const bundles = await listCommercialBundles(context.business.id);

  return { context, bundles };
});

export const getCommercialPriceBooksContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.COMMERCIAL_VIEW });
  const priceBooks = await listPriceBooks(context.business.id);

  return { context, priceBooks };
});
