import type {
  PlatformApiApplication,
  PlatformApiKey,
  PlatformApiRequestLog,
  PlatformApiWebhookSubscription,
} from "@prisma/client";

import type {
  ApiApplicationRecord,
  ApiKeyRecord,
  ApiRequestLogRecord,
  DeveloperSettingsRecord,
  DeveloperSummaryRecord,
  UsageAnalyticsRecord,
  WebhookSubscriptionRecord,
} from "@/modules/developer-platform-management/types/developer-platform-types";

export function serializeApiApplication(
  app: PlatformApiApplication & {
    _count?: { apiKeys: number; webhooks: number; requestLogs: number };
  },
): ApiApplicationRecord {
  return {
    id: app.id,
    name: app.name,
    description: app.description,
    clientId: app.clientId,
    status: app.status,
    apiVersion: app.apiVersion,
    keyCount: app._count?.apiKeys ?? 0,
    webhookCount: app._count?.webhooks ?? 0,
    logCount: app._count?.requestLogs ?? 0,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  };
}

export function serializeApiKey(
  key: PlatformApiKey & { application?: { name: string; clientId: string } },
): ApiKeyRecord {
  return {
    id: key.id,
    name: key.name,
    keyPrefix: `bk_${key.id.slice(0, 8)}`,
    applicationName: key.application?.name ?? "",
    clientId: key.application?.clientId ?? "",
    status: key.status,
    permissions: Array.isArray(key.permissions) ? (key.permissions as string[]) : [],
    expiresAt: key.expiresAt?.toISOString() ?? null,
    lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
    createdAt: key.createdAt.toISOString(),
  };
}

export function serializeWebhookSubscription(
  webhook: PlatformApiWebhookSubscription & { application?: { name: string } },
): WebhookSubscriptionRecord {
  return {
    id: webhook.id,
    event: webhook.event,
    endpoint: webhook.endpoint,
    status: webhook.status,
    applicationName: webhook.application?.name ?? "",
    createdAt: webhook.createdAt.toISOString(),
  };
}

export function serializeApiRequestLog(
  log: PlatformApiRequestLog & { application?: { name: string } | null },
): ApiRequestLogRecord {
  return {
    id: log.id,
    method: log.method,
    path: log.path,
    statusCode: log.statusCode,
    duration: log.duration,
    ipAddress: log.ipAddress,
    applicationName: log.application?.name ?? null,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeDeveloperSummary(summary: DeveloperSummaryRecord): DeveloperSummaryRecord {
  return summary;
}

export function serializeUsageAnalytics(analytics: UsageAnalyticsRecord): UsageAnalyticsRecord {
  return analytics;
}

export function serializeDeveloperSettings(
  settings: DeveloperSettingsRecord,
): DeveloperSettingsRecord {
  return settings;
}

export function validateApplicationName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Application name is required");
  return trimmed;
}

export function validateWebhookEndpoint(endpoint: string): string {
  const trimmed = endpoint.trim();
  if (!trimmed.startsWith("https://")) throw new Error("Webhook endpoint must use HTTPS");
  return trimmed;
}
