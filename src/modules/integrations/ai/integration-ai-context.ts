import { INTEGRATION_CATEGORIES } from "@/modules/integrations/constants/integration-status";
import { integrationService } from "@/modules/integrations/services/integration.service";
import {
  getConnectedCount,
  getErrorRatePercent,
  getIntegrationSummary,
  getTopApiEndpoints,
} from "@/modules/integrations/utils/integration-selectors";
import { recommendRateLimit } from "@/modules/integrations/utils/integration-rate-limit-utils";
import {
  getPendingRetryEvents,
  suggestRetryAction,
} from "@/modules/integrations/utils/integration-webhook-utils";
import type { IntegrationAiContext } from "@/modules/integrations/types/integration-platform";
import type { IntegrationCategory } from "@/modules/integrations/constants/integration-status";

export function buildIntegrationAiContext(): IntegrationAiContext {
  const record = integrationService.getRecord();

  return {
    ...record.aiContext,
    summary: getIntegrationSummary(record),
    connectedCount: getConnectedCount(record),
    lastGeneratedAt: new Date().toISOString(),
  };
}

export function recommendIntegrationForAi(input?: {
  category?: IntegrationCategory;
}): Record<string, unknown> {
  const record = integrationService.getRecord();
  const category = input?.category ?? INTEGRATION_CATEGORIES.DELIVERY;

  const connectedCategories = new Set(record.integrations.map((i) => i.category));
  const available = record.providers.filter(
    (p) => p.category === category && p.isAvailable && !connectedCategories.has(p.category),
  );

  const recommended =
    available[0] ?? record.providers.find((p) => p.id === record.aiContext.recommendedProviderId);

  return {
    category,
    recommendedProviderId: recommended?.id ?? null,
    recommendedProviderName: recommended?.name ?? null,
    reason: recommended
      ? `${recommended.name} available for ${category} integration`
      : "No new providers recommended for this category",
    mock: true,
  };
}

export function generateApiKeyForAi(input: {
  name: string;
  scopes?: string[];
}): Record<string, unknown> {
  const apiKey = integrationService.createApiKey({
    name: input.name,
    scopes: input.scopes ?? ["orders.read", "menu.read"],
    rateLimitPerHour: 1000,
  });

  return {
    apiKeyId: apiKey.id,
    keyPrefix: apiKey.keyPrefix,
    scopes: apiKey.scopes,
    status: apiKey.status,
    mock: true,
  };
}

export function analyzeApiUsageForAi(): Record<string, unknown> {
  const record = integrationService.getRecord();
  const analytics = record.developerAnalytics;

  return {
    totalRequests: analytics.totalRequests,
    errorRatePercent: getErrorRatePercent(analytics),
    averageLatencyMs: analytics.averageLatencyMs,
    topEndpoints: getTopApiEndpoints(analytics),
    usageByEndpoint: record.apiUsage.map((u) => ({
      endpoint: u.endpoint,
      requestCount: u.requestCount,
      errorCount: u.errorCount,
      averageLatencyMs: u.averageLatencyMs,
    })),
    mock: true,
  };
}

export function detectFailedWebhooksForAi(): Record<string, unknown> {
  const failed = integrationService.getFailedWebhookEvents();

  return {
    failedCount: failed.length,
    events: failed.map((e) => ({
      eventId: e.id,
      webhookId: e.webhookId,
      eventType: e.eventType,
      status: e.status,
      attemptCount: e.attemptCount,
      responseStatusCode: e.responseStatusCode,
    })),
    recommendedActions: recordFailedWebhookActions(failed.length),
    mock: true,
  };
}

function recordFailedWebhookActions(count: number): string[] {
  if (count === 0) {
    return ["All webhooks delivering successfully"];
  }

  return [
    "Review failed webhook endpoint availability",
    "Check retry queue for pending deliveries",
    "Verify webhook secret and URL configuration",
  ];
}

export function suggestRetryForAi(input?: { eventId?: string }): Record<string, unknown> {
  const record = integrationService.getRecord();
  const pending = getPendingRetryEvents(record.webhookEvents);

  const event = input?.eventId
    ? record.webhookEvents.find((e) => e.id === input.eventId)
    : pending[0];

  if (!event) {
    return { success: false, error: "No retryable events found", mock: true };
  }

  return {
    eventId: event.id,
    attemptCount: event.attemptCount,
    suggestion: suggestRetryAction(event),
    nextRetryAt: event.nextRetryAt,
    mock: true,
  };
}

export function explainApiErrorsForAi(input?: { requestId?: string }): Record<string, unknown> {
  const record = integrationService.getRecord();
  const errorResponses = record.apiResponses.filter((r) => r.errorCode !== null);

  const response = input?.requestId
    ? record.apiResponses.find((r) => r.requestId === input.requestId)
    : errorResponses[0];

  if (!response) {
    return { success: false, error: "No error responses found", mock: true };
  }

  const request = record.apiRequests.find((r) => r.id === response.requestId);

  return {
    requestId: response.requestId,
    statusCode: response.statusCode,
    errorCode: response.errorCode,
    errorMessage: response.errorMessage,
    path: request?.path ?? null,
    explanation: explainErrorCode(response.errorCode, response.statusCode),
    mock: true,
  };
}

function explainErrorCode(errorCode: string | null, statusCode: number): string {
  if (errorCode === "rate_limit_exceeded") {
    return "API rate limit exceeded — reduce request frequency or upgrade plan";
  }

  if (statusCode === 401) {
    return "Authentication failed — verify API key is valid and not revoked";
  }

  if (statusCode === 403) {
    return "Insufficient permissions — check API key scopes";
  }

  if (statusCode === 429) {
    return "Too many requests — implement exponential backoff";
  }

  return `HTTP ${statusCode} error — review request payload and endpoint configuration`;
}

export function recommendRateLimitsForAi(): Record<string, unknown> {
  const record = integrationService.getRecord();

  const recommendations = record.apiUsage
    .map((usage) => {
      const rateLimit = record.rateLimits.find((rl) => rl.apiKeyId === usage.apiKeyId);
      return rateLimit ? recommendRateLimit(usage, rateLimit) : null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return {
    recommendations,
    mock: true,
  };
}

export function generateIntegrationMappingForAi(input: {
  integrationId: string;
  sourceEntity: string;
  targetEntity: string;
}): Record<string, unknown> {
  const integration = integrationService.getIntegrationById(input.integrationId);

  if (!integration) {
    return { success: false, error: "Integration not found", mock: true };
  }

  const existingMapping = integrationService
    .getRecord()
    .mappings.find(
      (m) => m.integrationId === input.integrationId && m.sourceEntity === input.sourceEntity,
    );

  const fieldMappings = existingMapping?.fieldMappings ?? [
    { sourceField: "id", targetField: "ExternalId", transform: null },
    { sourceField: "name", targetField: "Name", transform: null },
    { sourceField: "createdAt", targetField: "CreatedDate", transform: "iso_to_date" },
  ];

  return {
    integrationId: input.integrationId,
    sourceEntity: input.sourceEntity,
    targetEntity: input.targetEntity,
    fieldMappings,
    mock: true,
  };
}
