"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { MARKETPLACE_PLATFORM_ROUTES } from "@/modules/marketplace-platform/constants/marketplace-platform";
import {
  installMarketplaceItem,
  purchaseMarketplaceItem,
  rollbackMarketplaceInstallation,
  submitMarketplaceReview,
  uninstallMarketplaceItem,
  updateMarketplaceInstallation,
} from "@/services/marketplace.service";
import { queryMarketplaceCatalog } from "@/services/marketplace-platform-module.service";

function revalidateMarketplacePlatformPaths() {
  Object.values(MARKETPLACE_PLATFORM_ROUTES).forEach((path) => {
    if (path.startsWith("/dashboard/marketplace-platform")) {
      revalidatePath(path);
    }
  });
  revalidatePath("/dashboard/marketplace-platform/catalog", "layout");
}

export async function searchMarketplaceCatalogAction(query: {
  search?: string;
  category?: string;
  pricing?: "FREE" | "PAID";
  sort?: string;
  page?: number;
}) {
  return protectedAction(PERMISSION_CODES.MARKETPLACE_VIEW, async () => {
    const catalog = await queryMarketplaceCatalog(query);
    return { success: true as const, catalog };
  });
}

export async function installMarketplacePlatformItemAction(itemId: string) {
  return protectedAction(PERMISSION_CODES.MARKETPLACE_INSTALL, async ({ platform }) => {
    const result = await installMarketplaceItem(platform, itemId);
    revalidateMarketplacePlatformPaths();
    return { success: true as const, result };
  });
}

export async function purchaseMarketplacePlatformItemAction(itemId: string) {
  return protectedAction(PERMISSION_CODES.MARKETPLACE_PURCHASE, async ({ platform }) => {
    const result = await purchaseMarketplaceItem(platform, itemId);
    revalidateMarketplacePlatformPaths();
    return { success: true as const, result };
  });
}

export async function updateMarketplacePlatformInstallationAction(
  itemId: string,
  versionId: string,
) {
  return protectedAction(PERMISSION_CODES.MARKETPLACE_INSTALL, async ({ platform }) => {
    const result = await updateMarketplaceInstallation(platform, itemId, versionId);
    revalidateMarketplacePlatformPaths();
    return { success: true as const, result };
  });
}

export async function rollbackMarketplacePlatformInstallationAction(itemId: string) {
  return protectedAction(PERMISSION_CODES.MARKETPLACE_INSTALL, async ({ platform }) => {
    const result = await rollbackMarketplaceInstallation(platform, itemId);
    revalidateMarketplacePlatformPaths();
    return { success: true as const, result };
  });
}

export async function uninstallMarketplacePlatformItemAction(itemId: string) {
  return protectedAction(PERMISSION_CODES.MARKETPLACE_INSTALL, async ({ platform }) => {
    const result = await uninstallMarketplaceItem(platform, itemId);
    revalidateMarketplacePlatformPaths();
    return { success: true as const, result };
  });
}

export async function submitMarketplacePlatformReviewAction(input: {
  itemId: string;
  rating: number;
  title?: string;
  content?: string;
}) {
  return protectedAction(PERMISSION_CODES.MARKETPLACE_VIEW, async ({ platform }) => {
    const result = await submitMarketplaceReview(platform, input);
    revalidateMarketplacePlatformPaths();
    return { success: true as const, result };
  });
}
