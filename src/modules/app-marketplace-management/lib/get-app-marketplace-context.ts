import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { resolveAuthorizationContext } from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import { APP_MARKETPLACE_ROUTES } from "@/modules/app-marketplace-management/constants/routes";
import {
  serializeAppReview,
  serializeAppUpdate,
  serializeInstalledApp,
  serializeMarketplaceApp,
  serializeMarketplaceSummary,
} from "@/modules/app-marketplace-management/lib/app-marketplace-validation";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  listMarketplaceApps,
  getMarketplaceApp,
  searchMarketplaceApps,
} from "@/services/app-registry.service";
import { listInstalledApps, getInstalledApp } from "@/services/app-installation-manager.service";
import { listAvailableUpdates } from "@/services/app-update-manager.service";
import { listBusinessReviews } from "@/services/app-review-manager.service";
import { getMarketplaceManagerOverview } from "@/services/marketplace-manager.service";
import { resolveAppMarketplacePermissions } from "@/services/app-marketplace-permission.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

export interface AppMarketplaceContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: ReturnType<typeof resolveAppMarketplacePermissions>;
}

async function resolveMarketplaceBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();
  const authorization = await resolveAuthorizationContext(user, business);
  return { business, authorization };
}

export const getAppMarketplaceContext = cache(async (): Promise<AppMarketplaceContext> => {
  const user = await requireApplicationAccess();
  const loaded = await resolveMarketplaceBusiness(user);
  const permissionsFlags = resolveAppMarketplacePermissions(
    loaded.authorization.permissions,
    loaded.authorization.isOwner,
  );

  if (!permissionsFlags.canView) redirect(ROUTES.application);

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags,
  };
});

export async function requireAppMarketplaceActionContext(
  permission: string,
): Promise<AppMarketplaceContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolveMarketplaceBusiness(user);
  const permissionsFlags = resolveAppMarketplacePermissions(
    loaded.authorization.permissions,
    loaded.authorization.isOwner,
  );

  const allowed = loaded.authorization.isOwner || loaded.authorization.permissions.has(permission);
  if (!allowed) throw permissionDenied();

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags,
  };
}

export const getAppMarketplaceHomeContext = cache(async () => {
  const context = await getAppMarketplaceContext();
  const overview = await getMarketplaceManagerOverview(context.user.id);
  const featured = await listMarketplaceApps();
  return {
    ...context,
    summary: serializeMarketplaceSummary(overview),
    featuredApps: featured.slice(0, 6).map(serializeMarketplaceApp),
  };
});

export const getAppMarketplaceStoreContext = cache(async (category?: string) => {
  const context = await getAppMarketplaceContext();
  const apps = await listMarketplaceApps({ category });
  return { ...context, apps: apps.map(serializeMarketplaceApp) };
});

export const getAppMarketplaceDetailContext = cache(async (appId: string) => {
  const context = await getAppMarketplaceContext();
  const app = await getMarketplaceApp(appId);
  if (!app || app.slug === "__audit_store__") redirect(APP_MARKETPLACE_ROUTES.store());
  return {
    ...context,
    app: serializeMarketplaceApp(app),
    reviews: app.reviews.map(serializeAppReview),
  };
});

export const getAppMarketplaceInstalledContext = cache(async () => {
  const context = await getAppMarketplaceContext();
  const installed = await listInstalledApps(context.user.id);
  return { ...context, installed: installed.map(serializeInstalledApp) };
});

export const getAppMarketplaceUpdatesContext = cache(async () => {
  const context = await getAppMarketplaceContext();
  const updates = await listAvailableUpdates(context.user.id);
  return { ...context, updates: updates.map(serializeAppUpdate) };
});

export const getAppMarketplaceSettingsContext = cache(async (installedAppId: string) => {
  const context = await getAppMarketplaceContext();
  const installed = await getInstalledApp(context.user.id, installedAppId);
  if (!installed) redirect(APP_MARKETPLACE_ROUTES.installed());
  return {
    ...context,
    installed: serializeInstalledApp(installed),
    configuration: installed.configuration,
  };
});

export const getAppMarketplaceReviewsContext = cache(async () => {
  const context = await getAppMarketplaceContext();
  const reviews = await listBusinessReviews(context.user.id);
  return { ...context, reviews: reviews.map(serializeAppReview) };
});

export const getAppMarketplaceCategoriesContext = cache(async () => {
  const context = await getAppMarketplaceContext();
  const overview = await getMarketplaceManagerOverview(context.user.id);
  return { ...context, categories: overview.catalog.categories };
});

export const getAppMarketplaceSearchContext = cache(async (query?: string) => {
  const context = await getAppMarketplaceContext();
  const trimmed = query?.trim() ?? "";
  if (!trimmed) return { ...context, search: "", apps: [] };
  const apps = await searchMarketplaceApps(trimmed);
  return {
    ...context,
    search: trimmed,
    apps: apps.map(serializeMarketplaceApp),
  };
});
