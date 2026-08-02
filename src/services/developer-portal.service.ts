import "server-only";

import {
  getDeveloperDashboardSummary,
  getDeveloperSettings,
  listApiApplications,
} from "@/services/api-application.service";
import { listApiKeys } from "@/services/api-key-manager.service";
import { listWebhookSubscriptions } from "@/services/api-webhook-subscription-manager.service";
import { getUsageAnalytics } from "@/services/api-request-logger.service";
import { API_ROUTE_CATALOG, SDK_FRAMEWORK_LANGUAGES } from "@/services/api-version-manager.service";

export async function getDeveloperPortalOverview(ownerId: string) {
  const [summary, applications, keys, webhooks, analytics, settings] = await Promise.all([
    getDeveloperDashboardSummary(ownerId),
    listApiApplications(ownerId),
    listApiKeys(ownerId),
    listWebhookSubscriptions(ownerId),
    getUsageAnalytics(ownerId),
    getDeveloperSettings(ownerId),
  ]);

  return {
    summary,
    applications: applications.filter((app) => app.name !== "__developer_settings__"),
    keys,
    webhooks,
    analytics,
    settings,
    routeCatalogCount: API_ROUTE_CATALOG.length,
    sdkLanguages: SDK_FRAMEWORK_LANGUAGES,
  };
}

export async function simulateApiExplorerRequest(
  ownerId: string,
  input: { method: string; path: string; apiKey?: string },
) {
  void ownerId;
  return {
    simulated: true,
    method: input.method.toUpperCase(),
    path: input.path,
    message: "API explorer simulated — no live public endpoint invoked",
  };
}
