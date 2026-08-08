import "server-only";

import type {
  ApiGatewayAuditLog,
  ApiRateLimitPolicy,
  ApiRequestLog,
  ApiWebhookDelivery,
  ApiWebhookRegistration,
  IntegrationCategory as PrismaCategory,
  IntegrationConnection,
  IntegrationLog,
  IntegrationLogLevel,
  IntegrationProvider as PrismaProvider,
  IntegrationStatus as PrismaStatus,
  IntegrationSyncJob,
  IntegrationSyncStatus,
  IntegrationWebhook,
  IamApiKey,
  PlatformApiApplication,
  PlatformApiKey,
  PlatformApiRequestLog,
  PlatformApiStatus,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";

import {
  API_KEY_STATUSES,
  INTEGRATION_CATEGORIES,
  INTEGRATION_STATUSES,
  LOG_LEVELS,
  OAUTH_STATUSES,
  SYNC_JOB_STATUSES,
  WEBHOOK_EVENT_STATUSES,
  WEBHOOK_STATUSES,
  type IntegrationCategory,
  type IntegrationStatus,
} from "@/modules/integrations/constants/integration-status";
import type { IntegrationTenantScope } from "@/modules/integrations/lib/integration-scope";
import type {
  ApiKey,
  ApiRateLimit,
  ApiRequest,
  ApiResponse,
  ApiUsage,
  DeveloperAnalytics,
  DeveloperApplication,
  DeveloperToken,
  ExternalAccount,
  ExternalSyncJob,
  Integration,
  IntegrationAiContext,
  IntegrationLog as PlatformLog,
  IntegrationMapping,
  IntegrationProvider,
  IntegrationRecord,
  OAuthConnection,
  Webhook,
  WebhookEndpoint,
  WebhookEvent,
} from "@/modules/integrations/types/integration-platform";

export interface StoredIntegrationBranchMeta {
  oauthConnections: OAuthConnection[];
  externalAccounts: ExternalAccount[];
  mappings: IntegrationMapping[];
  developerTokens: DeveloperToken[];
  webhookEndpoints: WebhookEndpoint[];
  apiClients: IntegrationRecord["apiClients"];
  apiResponses: ApiResponse[];
  apiScopes: string[];
}

export const DEFAULT_PROVIDER_CATALOG: Array<
  Omit<IntegrationProvider, "id"> & { slug: string }
> = [
  {
    slug: "stripe",
    name: "Stripe",
    category: INTEGRATION_CATEGORIES.PAYMENT,
    description: "Payment processing and subscriptions",
    logoUrl: null,
    authType: "api_key",
    supportedFeatures: ["payments", "subscriptions", "refunds"],
    isAvailable: true,
    documentationUrl: "https://stripe.com/docs",
  },
  {
    slug: "twilio",
    name: "Twilio",
    category: INTEGRATION_CATEGORIES.SMS,
    description: "SMS and voice communications",
    logoUrl: null,
    authType: "api_key",
    supportedFeatures: ["sms", "voice"],
    isAvailable: true,
    documentationUrl: "https://www.twilio.com/docs",
  },
  {
    slug: "whatsapp-business",
    name: "WhatsApp Business",
    category: INTEGRATION_CATEGORIES.WHATSAPP,
    description: "WhatsApp Business messaging",
    logoUrl: null,
    authType: "oauth2",
    supportedFeatures: ["messaging", "templates"],
    isAvailable: true,
    documentationUrl: "https://developers.facebook.com/docs/whatsapp",
  },
  {
    slug: "google-calendar",
    name: "Google Calendar",
    category: INTEGRATION_CATEGORIES.PRODUCTIVITY,
    description: "Calendar sync for reservations and staff",
    logoUrl: null,
    authType: "oauth2",
    supportedFeatures: ["events", "availability"],
    isAvailable: true,
    documentationUrl: "https://developers.google.com/calendar",
  },
  {
    slug: "google-maps",
    name: "Google Maps",
    category: INTEGRATION_CATEGORIES.MAPS,
    description: "Maps, geocoding, and delivery routing",
    logoUrl: null,
    authType: "api_key",
    supportedFeatures: ["geocoding", "directions"],
    isAvailable: true,
    documentationUrl: "https://developers.google.com/maps",
  },
  {
    slug: "google-analytics",
    name: "Google Analytics",
    category: INTEGRATION_CATEGORIES.ANALYTICS,
    description: "Web and app analytics",
    logoUrl: null,
    authType: "oauth2",
    supportedFeatures: ["reporting", "events"],
    isAvailable: true,
    documentationUrl: "https://developers.google.com/analytics",
  },
  {
    slug: "meta",
    name: "Meta",
    category: INTEGRATION_CATEGORIES.MESSAGING,
    description: "Facebook and Instagram integrations",
    logoUrl: null,
    authType: "oauth2",
    supportedFeatures: ["ads", "pages", "messaging"],
    isAvailable: true,
    documentationUrl: "https://developers.facebook.com",
  },
  {
    slug: "mailgun",
    name: "Mailgun",
    category: INTEGRATION_CATEGORIES.EMAIL,
    description: "Transactional email delivery",
    logoUrl: null,
    authType: "api_key",
    supportedFeatures: ["email", "templates"],
    isAvailable: true,
    documentationUrl: "https://documentation.mailgun.com",
  },
  {
    slug: "resend",
    name: "Resend",
    category: INTEGRATION_CATEGORIES.EMAIL,
    description: "Developer email API",
    logoUrl: null,
    authType: "api_key",
    supportedFeatures: ["email", "domains"],
    isAvailable: true,
    documentationUrl: "https://resend.com/docs",
  },
  {
    slug: "smtp",
    name: "SMTP",
    category: INTEGRATION_CATEGORIES.EMAIL,
    description: "Custom SMTP relay",
    logoUrl: null,
    authType: "custom",
    supportedFeatures: ["email"],
    isAvailable: true,
    documentationUrl: null,
  },
  {
    slug: "slack",
    name: "Slack",
    category: INTEGRATION_CATEGORIES.MESSAGING,
    description: "Team notifications and alerts",
    logoUrl: null,
    authType: "oauth2",
    supportedFeatures: ["channels", "webhooks"],
    isAvailable: true,
    documentationUrl: "https://api.slack.com",
  },
  {
    slug: "zapier",
    name: "Zapier",
    category: INTEGRATION_CATEGORIES.AUTOMATION,
    description: "Workflow automation platform",
    logoUrl: null,
    authType: "webhook",
    supportedFeatures: ["triggers", "actions"],
    isAvailable: true,
    documentationUrl: "https://platform.zapier.com",
  },
  {
    slug: "webhooks",
    name: "Webhooks",
    category: INTEGRATION_CATEGORIES.CUSTOM,
    description: "Custom HTTP webhook integrations",
    logoUrl: null,
    authType: "webhook",
    supportedFeatures: ["inbound", "outbound"],
    isAvailable: true,
    documentationUrl: null,
  },
];

const CATEGORY_TO_PRISMA: Record<IntegrationCategory, PrismaCategory> = {
  payment: "PAYMENT",
  accounting: "ACCOUNTING",
  delivery: "ECOMMERCE",
  messaging: "MESSAGING",
  email: "EMAIL",
  sms: "MESSAGING",
  whatsapp: "COMMUNICATION",
  maps: "OTHER",
  identity: "OTHER",
  storage: "OTHER",
  ai: "OTHER",
  erp: "OTHER",
  custom: "OTHER",
  productivity: "PRODUCTIVITY",
  analytics: "MARKETING",
  automation: "AUTOMATION",
};

const PRISMA_TO_CATEGORY: Record<PrismaCategory, IntegrationCategory> = {
  PAYMENT: INTEGRATION_CATEGORIES.PAYMENT,
  MESSAGING: INTEGRATION_CATEGORIES.MESSAGING,
  EMAIL: INTEGRATION_CATEGORIES.EMAIL,
  ACCOUNTING: INTEGRATION_CATEGORIES.ACCOUNTING,
  ECOMMERCE: INTEGRATION_CATEGORIES.DELIVERY,
  MARKETING: INTEGRATION_CATEGORIES.ANALYTICS,
  AUTOMATION: INTEGRATION_CATEGORIES.AUTOMATION,
  COMMUNICATION: INTEGRATION_CATEGORIES.WHATSAPP,
  CRM: INTEGRATION_CATEGORIES.MESSAGING,
  PRODUCTIVITY: INTEGRATION_CATEGORIES.PRODUCTIVITY,
  OTHER: INTEGRATION_CATEGORIES.CUSTOM,
};

const STATUS_TO_PRISMA: Record<IntegrationStatus, PrismaStatus> = {
  draft: "INACTIVE",
  pending: "INACTIVE",
  connected: "ACTIVE",
  disconnected: "DISCONNECTED",
  error: "ERROR",
  suspended: "DISCONNECTED",
};

const PRISMA_TO_STATUS: Record<PrismaStatus, IntegrationStatus> = {
  ACTIVE: INTEGRATION_STATUSES.CONNECTED,
  INACTIVE: INTEGRATION_STATUSES.PENDING,
  ERROR: INTEGRATION_STATUSES.ERROR,
  DISCONNECTED: INTEGRATION_STATUSES.DISCONNECTED,
};

export function toPrismaCategory(category: IntegrationCategory): PrismaCategory {
  return CATEGORY_TO_PRISMA[category] ?? "OTHER";
}

export function fromPrismaCategory(category: PrismaCategory): IntegrationCategory {
  return PRISMA_TO_CATEGORY[category] ?? INTEGRATION_CATEGORIES.CUSTOM;
}

export function fromPrismaStatus(status: PrismaStatus): IntegrationStatus {
  return PRISMA_TO_STATUS[status] ?? INTEGRATION_STATUSES.PENDING;
}

export function fromPlatformApiStatus(status: PlatformApiStatus): ApiKey["status"] {
  if (status === "ACTIVE") return API_KEY_STATUSES.ACTIVE;
  if (status === "EXPIRED") return API_KEY_STATUSES.EXPIRED;
  return API_KEY_STATUSES.REVOKED;
}

export function fromWebhookDeliveryStatus(
  status: ApiWebhookDelivery["status"],
): WebhookEvent["status"] {
  switch (status) {
    case "DELIVERED":
      return WEBHOOK_EVENT_STATUSES.DELIVERED;
    case "FAILED":
    case "DEAD_LETTER":
      return WEBHOOK_EVENT_STATUSES.FAILED;
    case "RETRYING":
      return WEBHOOK_EVENT_STATUSES.RETRYING;
    default:
      return WEBHOOK_EVENT_STATUSES.PENDING;
  }
}

export function fromSyncStatus(status: IntegrationSyncStatus): ExternalSyncJob["status"] {
  switch (status) {
    case "PENDING":
      return SYNC_JOB_STATUSES.QUEUED;
    case "RUNNING":
      return SYNC_JOB_STATUSES.RUNNING;
    case "COMPLETED":
      return SYNC_JOB_STATUSES.COMPLETED;
    case "FAILED":
      return SYNC_JOB_STATUSES.FAILED;
    case "CANCELLED":
      return SYNC_JOB_STATUSES.CANCELLED;
    default:
      return SYNC_JOB_STATUSES.QUEUED;
  }
}

export function fromLogLevel(level: IntegrationLogLevel): PlatformLog["level"] {
  switch (level) {
    case "DEBUG":
      return LOG_LEVELS.DEBUG;
    case "WARN":
      return LOG_LEVELS.WARN;
    case "ERROR":
      return LOG_LEVELS.ERROR;
    default:
      return LOG_LEVELS.INFO;
  }
}

export function defaultBranchIntegrationMeta(scope: IntegrationTenantScope): StoredIntegrationBranchMeta {
  return {
    oauthConnections: [],
    externalAccounts: [],
    mappings: [],
    developerTokens: [],
    webhookEndpoints: [],
    apiClients: [],
    apiResponses: [],
    apiScopes: ["orders.read", "orders.write", "menu.read", "reservations.read", "webhooks.manage"],
  };
}

export function mapProvider(
  catalogItem: (typeof DEFAULT_PROVIDER_CATALOG)[number],
  dbProvider: PrismaProvider | null,
  scope: IntegrationTenantScope,
): IntegrationProvider {
  return {
    id: dbProvider?.id ?? `catalog-${catalogItem.slug}`,
    slug: catalogItem.slug,
    name: catalogItem.name,
    category: catalogItem.category,
    description: catalogItem.description,
    logoUrl: catalogItem.logoUrl,
    authType: catalogItem.authType,
    supportedFeatures: catalogItem.supportedFeatures,
    isAvailable: catalogItem.isAvailable,
    documentationUrl: catalogItem.documentationUrl,
  };
}

export function mapConnection(
  connection: IntegrationConnection,
  provider: PrismaProvider,
  scope: IntegrationTenantScope,
): Integration {
  const config =
    connection.configuration && typeof connection.configuration === "object"
      ? Object.fromEntries(
          Object.entries(connection.configuration as Record<string, unknown>).map(([key, value]) => [
            key,
            String(value),
          ]),
        )
      : {};

  return {
    id: connection.id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    providerId: provider.id,
    name: connection.displayName,
    category: fromPrismaCategory(provider.category),
    status: fromPrismaStatus(connection.status),
    externalAccountId: config.externalAccountId ?? null,
    config,
    lastSyncAt: connection.lastSyncAt?.toISOString() ?? null,
    connectedAt: connection.createdAt.toISOString(),
    createdAt: connection.createdAt.toISOString(),
    updatedAt: connection.updatedAt.toISOString(),
  };
}

export function mapIamApiKey(key: IamApiKey, scope: IntegrationTenantScope): ApiKey {
  return {
    id: key.id,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    name: key.name,
    keyPrefix: key.keyPrefix,
    status: key.revokedAt ? API_KEY_STATUSES.REVOKED : API_KEY_STATUSES.ACTIVE,
    scopes: key.permissions,
    rateLimitPerHour: 1000,
    expiresAt: key.expiresAt?.toISOString() ?? null,
    lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
    createdByUserId: key.createdById ?? scope.userId,
    createdAt: key.createdAt.toISOString(),
  };
}

export function mapWebhookRegistration(
  registration: ApiWebhookRegistration,
  scope: IntegrationTenantScope,
): Webhook {
  const retryPolicy =
    registration.retryPolicy && typeof registration.retryPolicy === "object"
      ? (registration.retryPolicy as { maxAttempts?: number; backoffMs?: number })
      : {};

  return {
    id: registration.id,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    name: registration.name,
    url: registration.url,
    status: registration.isActive ? WEBHOOK_STATUSES.ACTIVE : WEBHOOK_STATUSES.INACTIVE,
    secret: registration.secret,
    eventTypes: Array.isArray(registration.events)
      ? registration.events.filter((event): event is string => typeof event === "string")
      : [],
    retryPolicy: {
      maxRetries: retryPolicy.maxAttempts ?? 5,
      backoffMs: retryPolicy.backoffMs ?? 1000,
    },
    isActive: registration.isActive,
    createdAt: registration.createdAt.toISOString(),
    updatedAt: registration.updatedAt.toISOString(),
  };
}

export function mapWebhookDelivery(delivery: ApiWebhookDelivery, scope: IntegrationTenantScope): WebhookEvent {
  return {
    id: delivery.id,
    tenantId: scope.tenantId,
    webhookId: delivery.registrationId,
    eventType: delivery.eventType,
    payload:
      delivery.payload && typeof delivery.payload === "object"
        ? (delivery.payload as Record<string, unknown>)
        : {},
    status: fromWebhookDeliveryStatus(delivery.status),
    attemptCount: delivery.attemptCount,
    responseStatusCode: delivery.responseStatus ?? null,
    responseBody: delivery.errorMessage,
    deliveredAt: delivery.deliveredAt?.toISOString() ?? null,
    nextRetryAt: delivery.nextRetryAt?.toISOString() ?? null,
    createdAt: delivery.createdAt.toISOString(),
  };
}

export function mapDeveloperApplication(
  application: PlatformApiApplication,
  scope: IntegrationTenantScope,
): DeveloperApplication {
  return {
    id: application.id,
    tenantId: scope.tenantId,
    name: application.name,
    description: application.description,
    clientId: application.clientId,
    webhookUrl: null,
    scopes: ["read"],
    isPublished: application.status === "ACTIVE",
    createdByUserId: application.createdBy ?? scope.userId,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
}

export function mapOAuthFromApplication(
  application: PlatformApiApplication,
  scope: IntegrationTenantScope,
): OAuthConnection {
  return {
    id: application.id,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    providerId: application.id,
    providerSlug: "busal-developer-api",
    status: application.status === "ACTIVE" ? OAUTH_STATUSES.AUTHORIZED : OAUTH_STATUSES.REVOKED,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
    scopes: ["read", "write"],
    authorizedAt: application.createdAt.toISOString(),
    revokedAt: application.status === "REVOKED" ? application.updatedAt.toISOString() : null,
  };
}

export function mapSyncJob(job: IntegrationSyncJob, scope: IntegrationTenantScope): ExternalSyncJob {
  const metadata =
    job.metadata && typeof job.metadata === "object"
      ? (job.metadata as Record<string, unknown>)
      : {};

  return {
    id: job.id,
    tenantId: scope.tenantId,
    integrationId: job.connectionId,
    jobType: String(metadata.jobType ?? "sync"),
    status: fromSyncStatus(job.status),
    direction: "bidirectional",
    recordsProcessed: Number(metadata.recordsProcessed ?? 0),
    recordsFailed: Number(metadata.recordsFailed ?? 0),
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt.toISOString(),
  };
}

export function mapIntegrationLog(log: IntegrationLog, scope: IntegrationTenantScope): PlatformLog {
  const metadata =
    log.metadata && typeof log.metadata === "object"
      ? Object.fromEntries(
          Object.entries(log.metadata as Record<string, unknown>).map(([key, value]) => [
            key,
            String(value),
          ]),
        )
      : {};

  return {
    id: log.id,
    tenantId: scope.tenantId,
    integrationId: log.connectionId ?? "",
    level: fromLogLevel(log.level),
    action: String(metadata.action ?? "sync"),
    message: log.message,
    metadata,
    occurredAt: log.createdAt.toISOString(),
  };
}

export function mapApiRequestLog(log: ApiRequestLog, scope: IntegrationTenantScope): ApiRequest {
  return {
    id: log.id,
    tenantId: scope.tenantId,
    apiKeyId: log.clientId,
    clientId: log.clientId,
    method: log.method as ApiRequest["method"],
    path: log.path,
    statusCode: log.statusCode,
    durationMs: log.responseTimeMs,
    ipAddress: log.ipAddress ?? "",
    userAgent: log.clientType ?? "",
    requestedAt: log.createdAt.toISOString(),
  };
}

export function mapPlatformRequestLog(log: PlatformApiRequestLog, scope: IntegrationTenantScope): ApiRequest {
  const metadata =
    log.metadata && typeof log.metadata === "object" ? (log.metadata as Record<string, unknown>) : {};

  return {
    id: log.id,
    tenantId: scope.tenantId,
    apiKeyId: log.applicationId,
    clientId: log.applicationId,
    method: log.method as ApiRequest["method"],
    path: log.path,
    statusCode: log.statusCode,
    durationMs: log.duration,
    ipAddress: log.ipAddress,
    userAgent: String(metadata.userAgent ?? ""),
    requestedAt: log.createdAt.toISOString(),
  };
}

export function mapRateLimitPolicy(policy: ApiRateLimitPolicy, scope: IntegrationTenantScope): ApiRateLimit {
  return {
    id: policy.id,
    tenantId: scope.tenantId,
    apiKeyId: policy.scopeIdentifier.startsWith("key:") ? policy.scopeIdentifier.slice(4) : null,
    endpoint: policy.name,
    limitPerHour: policy.requestsPerMinute * 60,
    limitPerDay: policy.requestsPerMinute * 60 * 24,
    burstLimit: policy.burstLimit,
    isActive: policy.isActive,
  };
}

export function buildApiUsage(
  requests: ApiRequest[],
  scope: IntegrationTenantScope,
  periodStart: string,
  periodEnd: string,
): ApiUsage[] {
  const grouped = new Map<string, { count: number; errors: number; totalMs: number }>();

  for (const request of requests) {
    const current = grouped.get(request.path) ?? { count: 0, errors: 0, totalMs: 0 };
    current.count += 1;
    if (request.statusCode >= 400) current.errors += 1;
    current.totalMs += request.durationMs;
    grouped.set(request.path, current);
  }

  return Array.from(grouped.entries()).map(([endpoint, stats], index) => ({
    id: `usage-${index}`,
    tenantId: scope.tenantId,
    apiKeyId: null,
    endpoint,
    requestCount: stats.count,
    errorCount: stats.errors,
    averageLatencyMs: stats.count > 0 ? Math.round(stats.totalMs / stats.count) : 0,
    periodStart,
    periodEnd,
  }));
}

export function buildDeveloperAnalytics(
  applications: DeveloperApplication[],
  apiKeys: ApiKey[],
  requests: ApiRequest[],
  scope: IntegrationTenantScope,
  periodStart: string,
  periodEnd: string,
): DeveloperAnalytics {
  const totalRequests = requests.length;
  const errorCount = requests.filter((request) => request.statusCode >= 400).length;
  const endpointCounts = new Map<string, number>();

  for (const request of requests) {
    endpointCounts.set(request.path, (endpointCounts.get(request.path) ?? 0) + 1);
  }

  const averageLatencyMs =
    totalRequests > 0
      ? Math.round(requests.reduce((sum, request) => sum + request.durationMs, 0) / totalRequests)
      : 0;

  return {
    tenantId: scope.tenantId,
    totalApplications: applications.length,
    activeApiKeys: apiKeys.filter((key) => key.status === API_KEY_STATUSES.ACTIVE).length,
    totalRequests,
    errorRateBps: totalRequests > 0 ? Math.round((errorCount / totalRequests) * 10000) : 0,
    averageLatencyMs,
    topEndpoints: Array.from(endpointCounts.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    periodStart,
    periodEnd,
  };
}

export function buildAiContext(
  record: IntegrationRecord,
  scope: IntegrationTenantScope,
): IntegrationAiContext {
  const connectedCount = record.integrations.filter((integration) => integration.status === "connected").length;
  const failedWebhookCount = record.webhookEvents.filter(
    (event) => event.status === "failed" || event.status === "retrying",
  ).length;

  const recommendedProvider =
    record.providers.find(
      (provider) =>
        provider.isAvailable &&
        !record.integrations.some(
          (integration) => integration.name === provider.name && integration.status === "connected",
        ),
    ) ?? null;

  return {
    tenantId: scope.tenantId,
    summary: `${connectedCount} connected integrations, ${record.apiKeys.length} API keys, ${failedWebhookCount} failed webhooks`,
    connectedCount,
    failedWebhookCount,
    recommendedProviderId: recommendedProvider?.id ?? null,
    insights: [
      `${record.developerAnalytics.totalRequests} API requests in current period`,
      `${record.developerAnalytics.activeApiKeys} active API keys`,
    ],
    recommendedActions:
      failedWebhookCount > 0
        ? ["Review failed webhook deliveries", "Verify endpoint secrets and retry policies"]
        : ["All integrations healthy"],
    lastGeneratedAt: new Date().toISOString(),
  };
}

export function mapIntegrationAggregate(
  scope: IntegrationTenantScope,
  dbProviders: PrismaProvider[],
  connections: IntegrationConnection[],
  iamApiKeys: IamApiKey[],
  webhookRegistrations: ApiWebhookRegistration[],
  webhookDeliveries: ApiWebhookDelivery[],
  applications: PlatformApiApplication[],
  syncJobs: IntegrationSyncJob[],
  logs: IntegrationLog[],
  apiRequestLogs: ApiRequestLog[],
  platformRequestLogs: PlatformApiRequestLog[],
  rateLimitPolicies: ApiRateLimitPolicy[],
  meta: StoredIntegrationBranchMeta,
): IntegrationRecord {
  const providerById = new Map(dbProviders.map((provider) => [provider.id, provider]));
  const providers = DEFAULT_PROVIDER_CATALOG.map((catalogItem) => {
    const dbProvider = dbProviders.find((provider) => provider.slug === catalogItem.slug) ?? null;
    return mapProvider(catalogItem, dbProvider, scope);
  });

  const integrations = connections
    .map((connection) => {
      const provider = providerById.get(connection.providerId);
      if (!provider) return null;
      return mapConnection(connection, provider, scope);
    })
    .filter((integration): integration is Integration => integration !== null);

  const apiKeys = iamApiKeys.map((key) => mapIamApiKey(key, scope));
  const webhooks = webhookRegistrations.map((registration) => mapWebhookRegistration(registration, scope));
  const webhookEvents = webhookDeliveries.map((delivery) => mapWebhookDelivery(delivery, scope));
  const developerApplications = applications.map((application) => mapDeveloperApplication(application, scope));
  const oauthConnections = [
    ...applications.map((application) => mapOAuthFromApplication(application, scope)),
    ...meta.oauthConnections,
  ];
  const apiRequests = [
    ...apiRequestLogs.map((log) => mapApiRequestLog(log, scope)),
    ...platformRequestLogs.map((log) => mapPlatformRequestLog(log, scope)),
  ];

  const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const periodEnd = new Date().toISOString();
  const apiUsage = buildApiUsage(apiRequests, scope, periodStart, periodEnd);
  const developerAnalytics = buildDeveloperAnalytics(
    developerApplications,
    apiKeys,
    apiRequests,
    scope,
    periodStart,
    periodEnd,
  );

  const record: IntegrationRecord = {
    integrations,
    providers,
    apiKeys,
    webhooks,
    webhookEndpoints: meta.webhookEndpoints,
    webhookEvents,
    oauthConnections,
    externalAccounts: meta.externalAccounts,
    syncJobs: syncJobs.map((job) => mapSyncJob(job, scope)),
    mappings: meta.mappings,
    logs: logs.map((log) => mapIntegrationLog(log, scope)),
    apiClients: meta.apiClients,
    apiRequests,
    apiResponses: meta.apiResponses,
    rateLimits: rateLimitPolicies.map((policy) => mapRateLimitPolicy(policy, scope)),
    apiUsage,
    developerApplications,
    developerTokens: meta.developerTokens,
    developerAnalytics,
    aiContext: buildAiContext(
      {
        integrations,
        providers,
        apiKeys,
        webhooks,
        webhookEndpoints: meta.webhookEndpoints,
        webhookEvents,
        oauthConnections,
        externalAccounts: meta.externalAccounts,
        syncJobs: syncJobs.map((job) => mapSyncJob(job, scope)),
        mappings: meta.mappings,
        logs: logs.map((log) => mapIntegrationLog(log, scope)),
        apiClients: meta.apiClients,
        apiRequests,
        apiResponses: meta.apiResponses,
        rateLimits: rateLimitPolicies.map((policy) => mapRateLimitPolicy(policy, scope)),
        apiUsage,
        developerApplications,
        developerTokens: meta.developerTokens,
        developerAnalytics,
        aiContext: {
          tenantId: scope.tenantId,
          summary: "",
          connectedCount: 0,
          failedWebhookCount: 0,
          recommendedProviderId: null,
          insights: [],
          recommendedActions: [],
          lastGeneratedAt: periodEnd,
        },
      },
      scope,
    ),
  };

  return record;
}

export function createMappingRecord(
  scope: IntegrationTenantScope,
  input: IntegrationMapping,
): IntegrationMapping {
  return {
    ...input,
    tenantId: scope.tenantId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createDeveloperTokenRecord(
  scope: IntegrationTenantScope,
  input: Omit<DeveloperToken, "id" | "tenantId" | "createdAt">,
): DeveloperToken {
  return {
    id: `devtok-${Date.now()}`,
    tenantId: scope.tenantId,
    ...input,
    createdAt: new Date().toISOString(),
  };
}

export type BranchSettingsJson = Prisma.InputJsonValue;
