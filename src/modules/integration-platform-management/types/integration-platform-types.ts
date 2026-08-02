import type {
  IntegrationCategory,
  IntegrationStatus,
  IntegrationSyncStatus,
  IntegrationLogLevel,
} from "@prisma/client";

export interface IntegrationProviderRecord {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  configuration: Record<string, unknown>;
  connectionCount: number;
  webhookCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationConnectionRecord {
  id: string;
  businessId: string;
  providerId: string;
  providerName: string;
  providerSlug: string;
  providerCategory: IntegrationCategory;
  displayName: string;
  status: IntegrationStatus;
  configuration: Record<string, unknown>;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationWebhookRecord {
  id: string;
  businessId: string;
  providerId: string;
  providerName: string;
  event: string;
  endpoint: string;
  status: IntegrationStatus;
  createdAt: string;
}

export interface IntegrationSyncJobRecord {
  id: string;
  connectionId: string;
  connectionName: string;
  providerName: string;
  status: IntegrationSyncStatus;
  attempts: number;
  maxAttempts: number;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface IntegrationLogRecord {
  id: string;
  connectionId: string | null;
  connectionName: string | null;
  level: IntegrationLogLevel;
  message: string;
  createdAt: string;
}

export interface CreateConnectionInput {
  providerId: string;
  displayName: string;
  apiKey?: string;
  apiSecret?: string;
}

export interface CreateWebhookInput {
  providerId: string;
  event: string;
  endpoint: string;
}
