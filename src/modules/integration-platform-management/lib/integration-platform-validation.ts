import type {
  IntegrationCategory,
  IntegrationLogLevel,
  IntegrationStatus,
  IntegrationSyncStatus,
} from "@prisma/client";

import type {
  IntegrationConnectionRecord,
  IntegrationLogRecord,
  IntegrationProviderRecord,
  IntegrationSyncJobRecord,
  IntegrationWebhookRecord,
} from "@/modules/integration-platform-management/types/integration-platform-types";

export function serializeIntegrationProvider(provider: {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  configuration: unknown;
  createdAt: Date;
  updatedAt: Date;
  _count?: { connections: number; webhooks: number };
}): IntegrationProviderRecord {
  return {
    id: provider.id,
    businessId: provider.businessId,
    name: provider.name,
    slug: provider.slug,
    category: provider.category,
    status: provider.status,
    configuration: (provider.configuration as Record<string, unknown>) ?? {},
    connectionCount: provider._count?.connections ?? 0,
    webhookCount: provider._count?.webhooks ?? 0,
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
  };
}

export function serializeIntegrationConnection(connection: {
  id: string;
  businessId: string;
  providerId: string;
  displayName: string;
  status: IntegrationStatus;
  configuration: unknown;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  provider: { name: string; slug: string; category: IntegrationCategory };
}): IntegrationConnectionRecord {
  return {
    id: connection.id,
    businessId: connection.businessId,
    providerId: connection.providerId,
    providerName: connection.provider.name,
    providerSlug: connection.provider.slug,
    providerCategory: connection.provider.category,
    displayName: connection.displayName,
    status: connection.status,
    configuration: (connection.configuration as Record<string, unknown>) ?? {},
    lastSyncAt: connection.lastSyncAt?.toISOString() ?? null,
    createdAt: connection.createdAt.toISOString(),
    updatedAt: connection.updatedAt.toISOString(),
  };
}

export function serializeIntegrationWebhook(webhook: {
  id: string;
  businessId: string;
  providerId: string;
  event: string;
  endpoint: string;
  status: IntegrationStatus;
  createdAt: Date;
  provider: { name: string; slug: string };
}): IntegrationWebhookRecord {
  return {
    id: webhook.id,
    businessId: webhook.businessId,
    providerId: webhook.providerId,
    providerName: webhook.provider.name,
    event: webhook.event,
    endpoint: webhook.endpoint,
    status: webhook.status,
    createdAt: webhook.createdAt.toISOString(),
  };
}

export function serializeIntegrationSyncJob(job: {
  id: string;
  connectionId: string;
  status: IntegrationSyncStatus;
  attempts: number;
  maxAttempts: number;
  scheduledAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  connection: { displayName: string; provider: { name: string; slug: string } };
}): IntegrationSyncJobRecord {
  return {
    id: job.id,
    connectionId: job.connectionId,
    connectionName: job.connection.displayName,
    providerName: job.connection.provider.name,
    status: job.status,
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
    scheduledAt: job.scheduledAt?.toISOString() ?? null,
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt.toISOString(),
  };
}

export function serializeIntegrationLog(log: {
  id: string;
  connectionId: string | null;
  level: IntegrationLogLevel;
  message: string;
  createdAt: Date;
  connection?: { displayName: string } | null;
}): IntegrationLogRecord {
  return {
    id: log.id,
    connectionId: log.connectionId,
    connectionName: log.connection?.displayName ?? null,
    level: log.level,
    message: log.message,
    createdAt: log.createdAt.toISOString(),
  };
}
