import type {
  IntegrationCategory,
  IntegrationStatus,
} from "@/modules/integrations/constants/integration-status";
import type {
  ApiKey,
  ApiRateLimit,
  ApiUsage,
  Integration,
  IntegrationProvider,
  IntegrationRecord,
  WebhookEvent,
} from "@/modules/integrations/types/integration-platform";

export function getIntegrationSummary(record: IntegrationRecord): string {
  const connected = record.integrations.filter((i) => i.status === "connected").length;
  return `${connected} connected — ${record.apiKeys.length} API keys, ${record.webhooks.length} webhooks`;
}

export function getIntegrationLabel(integration: Integration): string {
  return `${integration.name} (${integration.category})`;
}

export function isIntegrationConnected(integration: Integration): boolean {
  return integration.status === "connected";
}

export function getIntegrationsByCategory(
  record: IntegrationRecord,
  category: IntegrationCategory,
): Integration[] {
  return record.integrations.filter((i) => i.category === category);
}

export function getProvidersByCategory(
  providers: IntegrationProvider[],
  category: IntegrationCategory,
): IntegrationProvider[] {
  return providers.filter((p) => p.category === category);
}

export function getConnectedCount(record: IntegrationRecord): number {
  return record.integrations.filter((i) => i.status === "connected").length;
}

export function getFailedWebhookCount(events: WebhookEvent[]): number {
  return events.filter((e) => e.status === "failed" || e.status === "retrying").length;
}

export function getApiKeyLabel(apiKey: ApiKey): string {
  return `${apiKey.name} (${apiKey.keyPrefix}...)`;
}

export function getErrorRatePercent(analytics: IntegrationRecord["developerAnalytics"]): number {
  return analytics.errorRateBps / 100;
}

export function getUsageForEndpoint(usage: ApiUsage[], endpoint: string): ApiUsage | undefined {
  return usage.find((u) => u.endpoint === endpoint);
}

export function getRateLimitForKey(
  rateLimits: ApiRateLimit[],
  apiKeyId: string,
): ApiRateLimit | undefined {
  return rateLimits.find((rl) => rl.apiKeyId === apiKeyId);
}

export function getIntegrationsByStatus(
  record: IntegrationRecord,
  status: IntegrationStatus,
): Integration[] {
  return record.integrations.filter((i) => i.status === status);
}

export function getTopApiEndpoints(
  analytics: IntegrationRecord["developerAnalytics"],
  limit = 5,
): Array<{ path: string; count: number }> {
  return analytics.topEndpoints.slice(0, limit);
}
