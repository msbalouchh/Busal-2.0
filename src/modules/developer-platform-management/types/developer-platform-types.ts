import type { PlatformApiStatus, PlatformApiVersion } from "@prisma/client";

export interface ApiApplicationRecord {
  id: string;
  name: string;
  description: string;
  clientId: string;
  status: PlatformApiStatus;
  apiVersion: PlatformApiVersion;
  keyCount: number;
  webhookCount: number;
  logCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyRecord {
  id: string;
  name: string;
  keyPrefix: string;
  applicationName: string;
  clientId: string;
  status: PlatformApiStatus;
  permissions: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface WebhookSubscriptionRecord {
  id: string;
  event: string;
  endpoint: string;
  status: PlatformApiStatus;
  applicationName: string;
  createdAt: string;
}

export interface ApiRequestLogRecord {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  ipAddress: string;
  applicationName: string | null;
  createdAt: string;
}

export interface DeveloperSummaryRecord {
  applications: number;
  activeKeys: number;
  webhooks: number;
  requests24h: number;
  usageByStatus: Array<{ statusCode: number; count: number }>;
}

export interface UsageAnalyticsRecord {
  totalRequests7d: number;
  byMethod: Array<{ method: string; count: number; avgDuration: number }>;
  recentSamples: number;
}

export interface DeveloperSettingsRecord {
  rateLimitPerMinute: number;
  ipAllowList: string[];
  defaultApiVersion: PlatformApiVersion;
}
