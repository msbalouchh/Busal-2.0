import type {
  ApiAuthMethod,
  ApiRateLimitScope,
  ApiRouteType,
  ApiVersionStrategy,
} from "@prisma/client";

export interface RegisteredApiRouteDefinition {
  routeKey: string;
  path: string;
  method: string;
  routeType: ApiRouteType;
  serviceTarget: string;
  version?: string;
  versionStrategy?: ApiVersionStrategy;
  requiredPermission?: string | null;
  apiScopes?: string[];
  authMethods?: ApiAuthMethod[];
  maxPayloadBytes?: number;
  allowedContentTypes?: string[];
  requestSchema?: Record<string, unknown>;
  openapiSpec?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  isActive: boolean;
}

export interface GatewayRequestInput {
  method: string;
  path: string;
  apiVersion?: string | null;
  contentType?: string | null;
  payloadSizeBytes?: number;
  body?: unknown;
  authMethod?: ApiAuthMethod;
  authToken?: string | null;
  apiKey?: string | null;
  ipAddress?: string | null;
  clientId?: string | null;
  serviceAccountId?: string | null;
}

export interface GatewayAuthContext {
  userId?: string | null;
  businessId?: string | null;
  branchId?: string | null;
  roleSlug?: string | null;
  permissions: string[];
  isOwner: boolean;
  apiScopes: string[];
  authMethod: ApiAuthMethod;
}

export interface GatewayRouteMatch {
  routeId: string;
  routeKey: string;
  serviceTarget: string;
  routeType: ApiRouteType;
  version: string;
  requiredPermission?: string | null;
  apiScopes: string[];
}

export interface GatewayValidationResult {
  valid: boolean;
  errors: string[];
}

export interface GatewayRequestResult {
  allowed: boolean;
  statusCode: number;
  route?: GatewayRouteMatch;
  serviceTarget?: string;
  responseTimeMs: number;
  error?: string;
  rateLimited?: boolean;
}

export interface RateLimitCheckInput {
  scope: ApiRateLimitScope;
  scopeIdentifier: string;
  requestsPerMinute: number;
  burstLimit: number;
  currentCount: number;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
}

export interface WebhookRetryPolicy {
  maxAttempts: number;
  backoffMs: number;
}

export interface RegisterWebhookInput {
  name: string;
  url: string;
  secret: string;
  events: string[];
  retryPolicy?: WebhookRetryPolicy;
}

export interface DeliverWebhookInput {
  registrationId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

export interface ApiGatewayDashboardMetrics {
  totalRoutes: number;
  activeRoutes: number;
  totalRequests: number;
  recentRequests: number;
  errorRate: number;
  successRate: number;
  avgResponseTimeMs: number;
  rateLimitEvents: number;
  webhookDeliveries: number;
  registeredEndpoints: number;
}

export interface ApiRouteView {
  id: string;
  routeKey: string;
  path: string;
  method: string;
  routeType: ApiRouteType;
  serviceTarget: string;
  version: string;
  isActive: boolean;
}

export interface ApiRateLimitPolicyView {
  id: string;
  name: string;
  scope: ApiRateLimitScope;
  scopeIdentifier: string;
  requestsPerMinute: number;
  burstLimit: number;
}

export interface ApiRequestLogView {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  responseTimeMs: number;
  createdAt: string;
}

export interface ApiWebhookRegistrationView {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
}

export interface ApiWebhookDeliveryView {
  id: string;
  eventType: string;
  status: string;
  attemptCount: number;
  createdAt: string;
}

export interface ApiGatewayAuditLogView {
  id: string;
  eventType: string;
  routeKey: string | null;
  createdAt: string;
}

export interface OpenApiRegistryEntry {
  routeKey: string;
  path: string;
  method: string;
  version: string;
  routeType: ApiRouteType;
  serviceTarget: string;
  spec?: Record<string, unknown>;
}
