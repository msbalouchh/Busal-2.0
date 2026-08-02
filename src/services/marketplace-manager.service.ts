import "server-only";

import {
  ensureDefaultMarketplaceCatalog,
  getMarketplaceHomeSummary,
} from "@/services/app-registry.service";
import { getInstalledAppsSummary } from "@/services/app-installation-manager.service";
import { listAvailableUpdates } from "@/services/app-update-manager.service";

export async function getMarketplaceManagerOverview(ownerId: string) {
  await ensureDefaultMarketplaceCatalog();
  const [catalog, installed, updates] = await Promise.all([
    getMarketplaceHomeSummary(),
    getInstalledAppsSummary(ownerId),
    listAvailableUpdates(ownerId),
  ]);

  return { catalog, installed, pendingUpdates: updates.length };
}

export async function browseMarketplace(filters?: { category?: string; search?: string }) {
  await ensureDefaultMarketplaceCatalog();
  const { listMarketplaceApps } = await import("@/services/app-registry.service");
  return listMarketplaceApps({
    category: filters?.category,
    search: filters?.search,
  });
}
