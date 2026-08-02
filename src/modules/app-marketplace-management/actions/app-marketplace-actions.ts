"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { APP_MARKETPLACE_ROUTES } from "@/modules/app-marketplace-management/constants/routes";
import { requireAppMarketplaceActionContext } from "@/modules/app-marketplace-management/lib/get-app-marketplace-context";
import {
  disableInstalledApp,
  enableInstalledApp,
  installApp,
  uninstallApp,
} from "@/services/app-installation-manager.service";
import { updateAppConfiguration } from "@/services/app-configuration-manager.service";
import { createAppReview } from "@/services/app-review-manager.service";
import { rollbackInstalledApp, updateInstalledApp } from "@/services/app-update-manager.service";

function revalidateMarketplacePages(): void {
  const routes = [
    APP_MARKETPLACE_ROUTES.home(),
    APP_MARKETPLACE_ROUTES.store(),
    APP_MARKETPLACE_ROUTES.installed(),
    APP_MARKETPLACE_ROUTES.updates(),
    APP_MARKETPLACE_ROUTES.reviews(),
    APP_MARKETPLACE_ROUTES.categories(),
    APP_MARKETPLACE_ROUTES.search(),
  ];
  for (const route of routes) revalidatePath(route);
}

export async function installAppAction(appId: string) {
  const context = await requireAppMarketplaceActionContext(PERMISSION_CODES.MARKETPLACE_INSTALL);
  await installApp(context.user.id, appId);
  revalidateMarketplacePages();
}

export async function uninstallAppAction(installedAppId: string) {
  const context = await requireAppMarketplaceActionContext(PERMISSION_CODES.MARKETPLACE_DELETE);
  await uninstallApp(context.user.id, installedAppId);
  revalidateMarketplacePages();
}

export async function enableAppAction(installedAppId: string) {
  const context = await requireAppMarketplaceActionContext(PERMISSION_CODES.MARKETPLACE_UPDATE);
  await enableInstalledApp(context.user.id, installedAppId);
  revalidateMarketplacePages();
}

export async function disableAppAction(installedAppId: string) {
  const context = await requireAppMarketplaceActionContext(PERMISSION_CODES.MARKETPLACE_UPDATE);
  await disableInstalledApp(context.user.id, installedAppId);
  revalidateMarketplacePages();
}

export async function updateAppAction(installedAppId: string) {
  const context = await requireAppMarketplaceActionContext(PERMISSION_CODES.MARKETPLACE_UPDATE);
  await updateInstalledApp(context.user.id, installedAppId);
  revalidateMarketplacePages();
}

export async function rollbackAppAction(installedAppId: string) {
  const context = await requireAppMarketplaceActionContext(PERMISSION_CODES.MARKETPLACE_MANAGE);
  await rollbackInstalledApp(context.user.id, installedAppId);
  revalidateMarketplacePages();
}

export async function updateAppConfigurationAction(
  installedAppId: string,
  configuration: Record<string, unknown>,
) {
  const context = await requireAppMarketplaceActionContext(PERMISSION_CODES.MARKETPLACE_UPDATE);
  await updateAppConfiguration(context.user.id, installedAppId, configuration);
  revalidateMarketplacePages();
}

export async function createAppReviewAction(input: {
  appId: string;
  rating: number;
  review?: string;
}) {
  const context = await requireAppMarketplaceActionContext(PERMISSION_CODES.MARKETPLACE_VIEW);
  await createAppReview(context.user.id, input);
  revalidateMarketplacePages();
}
