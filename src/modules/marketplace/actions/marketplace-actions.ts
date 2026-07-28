"use server";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import {
  deprecateMarketplaceItem,
  installMarketplaceItem,
  publishMarketplaceItemVersion,
  purchaseMarketplaceItem,
  reportMarketplaceIssue,
  rollbackMarketplaceInstallation,
  submitMarketplaceReview,
  uninstallMarketplaceItem,
  updateMarketplaceInstallation,
} from "@/services/marketplace.service";

export async function installMarketplaceItemAction(itemId: string) {
  return protectedAction(PERMISSION_CODES.MARKETPLACE_INSTALL, async ({ platform }) =>
    installMarketplaceItem(platform, itemId),
  );
}

export async function updateMarketplaceInstallationAction(itemId: string, versionId: string) {
  return protectedAction(PERMISSION_CODES.MARKETPLACE_INSTALL, async ({ platform }) =>
    updateMarketplaceInstallation(platform, itemId, versionId),
  );
}

export async function rollbackMarketplaceInstallationAction(itemId: string) {
  return protectedAction(PERMISSION_CODES.MARKETPLACE_INSTALL, async ({ platform }) =>
    rollbackMarketplaceInstallation(platform, itemId),
  );
}

export async function uninstallMarketplaceItemAction(itemId: string) {
  return protectedAction(PERMISSION_CODES.MARKETPLACE_INSTALL, async ({ platform }) =>
    uninstallMarketplaceItem(platform, itemId),
  );
}

export async function purchaseMarketplaceItemAction(itemId: string) {
  return protectedAction(PERMISSION_CODES.MARKETPLACE_PURCHASE, async ({ platform }) =>
    purchaseMarketplaceItem(platform, itemId),
  );
}

export async function submitMarketplaceReviewAction(input: {
  itemId: string;
  rating: number;
  title?: string;
  content?: string;
}) {
  return protectedAction(PERMISSION_CODES.MARKETPLACE_VIEW, async ({ platform }) =>
    submitMarketplaceReview(platform, input),
  );
}

export async function reportMarketplaceIssueAction(input: {
  itemId: string;
  description: string;
  reviewId?: string;
}) {
  return protectedAction(PERMISSION_CODES.MARKETPLACE_VIEW, async ({ platform }) =>
    reportMarketplaceIssue(platform, input),
  );
}

export async function publishMarketplaceItemVersionAction(input: {
  itemId: string;
  versionLabel: string;
  changelog?: string;
}) {
  return protectedAction(PERMISSION_CODES.MARKETPLACE_PUBLISH, async ({ platform }) =>
    publishMarketplaceItemVersion(platform, input),
  );
}

export async function deprecateMarketplaceItemAction(itemId: string) {
  return protectedAction(PERMISSION_CODES.MARKETPLACE_PUBLISH, async ({ platform }) =>
    deprecateMarketplaceItem(platform, itemId),
  );
}
