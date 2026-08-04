import type {
  ApiKeyStatus,
  ApiMethod,
  DeveloperScope,
  IntegrationCategory,
  IntegrationStatus,
  LogLevel,
  OAuthStatus,
  SyncJobStatus,
  WebhookEventStatus,
  WebhookStatus,
} from "@/modules/integrations/constants/integration-status";

/** Active third-party integration connection. */
export interface Integration {
  id: string;
  tenantId: string;
  workspaceId: string;
  businessId: string;
  providerId: string;
  name: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  externalAccountId: string | null;
  config: Record<string, string>;
  lastSyncAt: string | null;
  connectedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Third-party integration provider definition. */
export interface IntegrationProvider {
  id: string;
  slug: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  logoUrl: string | null;
  authType: "api_key" | "oauth2" | "webhook" | "custom";
  supportedFeatures: string[];
  isAvailable: boolean;
  documentationUrl: string | null;
}

/** API key for Busal or external API access. */
export interface ApiKey {
  id: string;
  tenantId: string;
  businessId: string;
  name: string;
  keyPrefix: string;
  status: ApiKeyStatus;
  scopes: string[];
  rateLimitPerHour: number;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdByUserId: string;
  createdAt: string;
}

/** Outbound webhook subscription. */
export interface Webhook {
  id: string;
  tenantId: string;
  businessId: string;
  name: string;
  url: string;
  status: WebhookStatus;
  secret: string;
  eventTypes: string[];
  retryPolicy: { maxRetries: number; backoffMs: number };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Registered webhook endpoint (inbound). */
export interface WebhookEndpoint {
  id: string;
  tenantId: string;
  integrationId: string;
  path: string;
  method: ApiMethod;
  providerSlug: string;
  isVerified: boolean;
  verificationToken: string | null;
  createdAt: string;
}

/** Individual webhook delivery event. */
export interface WebhookEvent {
  id: string;
  tenantId: string;
  webhookId: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: WebhookEventStatus;
  attemptCount: number;
  responseStatusCode: number | null;
  responseBody: string | null;
  deliveredAt: string | null;
  nextRetryAt: string | null;
  createdAt: string;
}

/** OAuth2 connection to external provider. */
export interface OAuthConnection {
  id: string;
  tenantId: string;
  businessId: string;
  providerId: string;
  providerSlug: string;
  status: OAuthStatus;
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  scopes: string[];
  authorizedAt: string | null;
  revokedAt: string | null;
}

/** Linked external account. */
export interface ExternalAccount {
  id: string;
  tenantId: string;
  integrationId: string;
  providerSlug: string;
  externalId: string;
  displayName: string;
  email: string | null;
  metadata: Record<string, string>;
  linkedAt: string;
}

/** Background sync job with external system. */
export interface ExternalSyncJob {
  id: string;
  tenantId: string;
  integrationId: string;
  jobType: string;
  status: SyncJobStatus;
  direction: "import" | "export" | "bidirectional";
  recordsProcessed: number;
  recordsFailed: number;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

/** Field mapping between Busal and external system. */
export interface IntegrationMapping {
  id: string;
  tenantId: string;
  integrationId: string;
  sourceEntity: string;
  targetEntity: string;
  fieldMappings: Array<{ sourceField: string; targetField: string; transform: string | null }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Integration activity log entry. */
export interface IntegrationLog {
  id: string;
  tenantId: string;
  integrationId: string;
  level: LogLevel;
  action: string;
  message: string;
  metadata: Record<string, string>;
  occurredAt: string;
}

/** Registered API client application. */
export interface ApiClient {
  id: string;
  tenantId: string;
  name: string;
  clientId: string;
  redirectUris: string[];
  scopes: DeveloperScope[];
  isActive: boolean;
  createdAt: string;
}

/** API request audit record. */
export interface ApiRequest {
  id: string;
  tenantId: string;
  apiKeyId: string | null;
  clientId: string | null;
  method: ApiMethod;
  path: string;
  statusCode: number;
  durationMs: number;
  ipAddress: string;
  userAgent: string;
  requestedAt: string;
}

/** API response audit record. */
export interface ApiResponse {
  id: string;
  requestId: string;
  statusCode: number;
  bodySizeBytes: number;
  headers: Record<string, string>;
  errorCode: string | null;
  errorMessage: string | null;
  respondedAt: string;
}

/** Rate limit configuration. */
export interface ApiRateLimit {
  id: string;
  tenantId: string;
  apiKeyId: string | null;
  endpoint: string;
  limitPerHour: number;
  limitPerDay: number;
  burstLimit: number;
  isActive: boolean;
}

/** API usage metrics snapshot. */
export interface ApiUsage {
  id: string;
  tenantId: string;
  apiKeyId: string | null;
  endpoint: string;
  requestCount: number;
  errorCount: number;
  averageLatencyMs: number;
  periodStart: string;
  periodEnd: string;
}

/** Developer portal application. */
export interface DeveloperApplication {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  clientId: string;
  webhookUrl: string | null;
  scopes: DeveloperScope[];
  isPublished: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

/** Developer access token. */
export interface DeveloperToken {
  id: string;
  tenantId: string;
  applicationId: string;
  tokenPrefix: string;
  scopes: DeveloperScope[];
  expiresAt: string;
  lastUsedAt: string | null;
  isRevoked: boolean;
  createdAt: string;
}

/** Developer platform analytics. */
export interface DeveloperAnalytics {
  tenantId: string;
  totalApplications: number;
  activeApiKeys: number;
  totalRequests: number;
  errorRateBps: number;
  averageLatencyMs: number;
  topEndpoints: Array<{ path: string; count: number }>;
  periodStart: string;
  periodEnd: string;
}

/** AI-enriched integration context. */
export interface IntegrationAiContext {
  tenantId: string;
  summary: string;
  connectedCount: number;
  failedWebhookCount: number;
  recommendedProviderId: string | null;
  insights: string[];
  recommendedActions: string[];
  lastGeneratedAt: string;
}

/** Full integration aggregate — single source of truth. */
export interface IntegrationRecord {
  integrations: Integration[];
  providers: IntegrationProvider[];
  apiKeys: ApiKey[];
  webhooks: Webhook[];
  webhookEndpoints: WebhookEndpoint[];
  webhookEvents: WebhookEvent[];
  oauthConnections: OAuthConnection[];
  externalAccounts: ExternalAccount[];
  syncJobs: ExternalSyncJob[];
  mappings: IntegrationMapping[];
  logs: IntegrationLog[];
  apiClients: ApiClient[];
  apiRequests: ApiRequest[];
  apiResponses: ApiResponse[];
  rateLimits: ApiRateLimit[];
  apiUsage: ApiUsage[];
  developerApplications: DeveloperApplication[];
  developerTokens: DeveloperToken[];
  developerAnalytics: DeveloperAnalytics;
  aiContext: IntegrationAiContext;
}

export interface IntegrationSearchQuery {
  query?: string;
  tenantId?: string;
  businessId?: string;
  category?: IntegrationCategory;
  status?: IntegrationStatus;
  limit?: number;
}

export interface CreateApiKeyInput {
  name: string;
  scopes: string[];
  rateLimitPerHour?: number;
  expiresAt?: string;
}

export interface CreateWebhookInput {
  name: string;
  url: string;
  eventTypes: string[];
}

export interface IntegrationPlatformContext {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  userId: string;
}

export interface IntegrationContextValue {
  context: IntegrationPlatformContext;
  record: IntegrationRecord;
  selectedIntegrationId: string | null;
  selectedIntegration: Integration | null;
  selectIntegration: (integrationId: string | null) => void;
  refresh: () => void;
}

export interface IntegrationWebhooksContextValue {
  webhooks: Webhook[];
  webhookEvents: WebhookEvent[];
  failedEventCount: number;
  refresh: () => void;
}

export interface IntegrationDeveloperContextValue {
  applications: DeveloperApplication[];
  apiKeys: ApiKey[];
  tokens: DeveloperToken[];
  refresh: () => void;
}
