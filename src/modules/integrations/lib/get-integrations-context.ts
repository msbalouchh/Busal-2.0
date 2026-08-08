import { cache } from "react";

import { INTEGRATION_MODULE_PERMISSIONS } from "@/modules/integrations/constants/permissions";
import {
  resolveIntegrationScope,
  toIntegrationPlatformContext,
} from "@/modules/integrations/lib/integration-scope";
import { buildIntegrationPlatformSnapshot } from "@/modules/integrations/services/integration-platform.service";
import { integrationService } from "@/modules/integrations/services/integration.service";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";

export const getIntegrationsOverviewContext = cache(async () => {
  const platform = await protectedPage({ permission: INTEGRATION_MODULE_PERMISSIONS.API_READ });
  const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
  const snapshot = await buildIntegrationPlatformSnapshot(context);

  return {
    context: platform,
    dashboard: {
      connectedIntegrations: snapshot.connectedCount,
      activeApiKeys: snapshot.activeApiKeyCount,
      activeWebhooks: snapshot.activeWebhookCount,
      failedWebhookEvents: snapshot.failedWebhookEventCount,
      totalApiRequests: snapshot.totalApiRequests,
      errorRateBps: snapshot.errorRateBps,
    },
  };
});

export const getIntegrationsPlatformModuleContext = cache(async () => {
  const platform = await protectedPage({ permission: INTEGRATION_MODULE_PERMISSIONS.API_READ });
  const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
  return buildIntegrationPlatformSnapshot(context);
});

export const getIntegrationsCatalogContext = cache(async () => {
  const platform = await protectedPage({ permission: INTEGRATION_MODULE_PERMISSIONS.API_READ });
  const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
  const record = await integrationService.getRecord(context);
  return { context: platform, providers: record.providers, integrations: record.integrations };
});

export const getIntegrationsDeveloperContext = cache(async () => {
  const platform = await protectedPage({ permission: INTEGRATION_MODULE_PERMISSIONS.API_READ });
  const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
  const record = await integrationService.getRecord(context);
  return {
    context: platform,
    applications: record.developerApplications,
    apiKeys: record.apiKeys,
    tokens: record.developerTokens,
    analytics: record.developerAnalytics,
  };
});

export const getIntegrationsWebhooksContext = cache(async () => {
  const platform = await protectedPage({ permission: INTEGRATION_MODULE_PERMISSIONS.API_READ });
  const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
  const record = await integrationService.getRecord(context);
  return {
    context: platform,
    webhooks: record.webhooks,
    events: record.webhookEvents,
    failedCount: record.webhookEvents.filter((event) => event.status === "failed" || event.status === "retrying").length,
  };
});

export const getIntegrationsLogsContext = cache(async () => {
  const platform = await protectedPage({ permission: INTEGRATION_MODULE_PERMISSIONS.API_READ });
  const context = toIntegrationPlatformContext(resolveIntegrationScope(platform));
  const record = await integrationService.getRecord(context);
  return { context: platform, logs: record.logs, requests: record.apiRequests.slice(0, 100) };
});
