"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { COMMERCIAL_ROUTES } from "@/modules/commercial/constants/routes";
import type { CommercialBillingCycle, CommercialPricingModel } from "@prisma/client";
import type { PriceBookType } from "@prisma/client";
import {
  archiveCommercialProduct,
  createCommercialBundle,
  createCommercialCategory,
  createCommercialProduct,
  createPriceBook,
  updateCommercialProduct,
} from "@/services/commercial-catalogue.service";

function revalidateCommercialPaths() {
  Object.values(COMMERCIAL_ROUTES).forEach((path) => {
    revalidatePath(path);
  });
}

export async function createCommercialCategoryAction(input: {
  name: string;
  description?: string | null;
}) {
  return protectedAction(PERMISSION_CODES.COMMERCIAL_CREATE, async ({ business, platform }) => {
    const category = await createCommercialCategory(
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateCommercialPaths();
    return { success: true as const, categoryId: category.id };
  });
}

export async function createCommercialProductAction(input: {
  sku: string;
  categoryId?: string | null;
  name: string;
  description?: string | null;
  pricingModel: CommercialPricingModel;
  basePricePence: number;
  currency?: string;
  taxClass?: string | null;
  industry?: string | null;
  setupRequired?: boolean;
  requiresContract?: boolean;
  renewable?: boolean;
  defaultBillingCycle?: CommercialBillingCycle | null;
  estimatedDeliveryTime?: string | null;
  assignedDepartment?: string | null;
  serviceChecklistTemplate?: string | null;
  documentation?: string | null;
}) {
  return protectedAction(PERMISSION_CODES.COMMERCIAL_CREATE, async ({ business, platform }) => {
    const product = await createCommercialProduct(
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateCommercialPaths();
    return { success: true as const, productId: product.id };
  });
}

export async function updateCommercialProductAction(
  productId: string,
  input: Parameters<typeof createCommercialProductAction>[0],
) {
  return protectedAction(PERMISSION_CODES.COMMERCIAL_UPDATE, async ({ business, platform }) => {
    await updateCommercialProduct(
      productId,
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateCommercialPaths();
    return { success: true as const };
  });
}

export async function archiveCommercialProductAction(productId: string) {
  return protectedAction(PERMISSION_CODES.COMMERCIAL_ARCHIVE, async ({ business, platform }) => {
    await archiveCommercialProduct(productId, business.id, platform.staffSession?.staffId ?? null);
    revalidateCommercialPaths();
    return { success: true as const };
  });
}

export async function createCommercialBundleAction(input: {
  sku: string;
  name: string;
  description?: string | null;
  bundlePricePence: number;
  currency?: string;
  pricingModel?: CommercialPricingModel;
  items: Array<{
    productVersionId: string;
    quantity?: number;
    individualPricePence: number;
  }>;
}) {
  return protectedAction(
    PERMISSION_CODES.COMMERCIAL_MANAGE_BUNDLES,
    async ({ business, platform }) => {
      const bundle = await createCommercialBundle(
        business.id,
        platform.staffSession?.staffId ?? null,
        input,
      );
      revalidateCommercialPaths();
      return { success: true as const, bundleId: bundle.id };
    },
  );
}

export async function createPriceBookAction(input: {
  code: string;
  type: PriceBookType;
  name: string;
  description?: string | null;
  countryCode?: string | null;
  partnerId?: string | null;
  entries?: Array<{
    productVersionId?: string;
    bundleVersionId?: string;
    pricePence: number;
    currency?: string;
    pricingModel?: CommercialPricingModel;
  }>;
}) {
  return protectedAction(
    PERMISSION_CODES.COMMERCIAL_MANAGE_PRICES,
    async ({ business, platform }) => {
      const priceBook = await createPriceBook(
        business.id,
        platform.staffSession?.staffId ?? null,
        input,
      );
      revalidateCommercialPaths();
      return { success: true as const, priceBookId: priceBook.id };
    },
  );
}
