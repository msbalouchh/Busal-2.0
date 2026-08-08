import "server-only";

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
import type { IntegrationAiContext, IntegrationPlatformContext } from "@/modules/integrations/types/integration-platform";
import type { IntegrationCategory } from "@/modules/integrations/constants/integration-status";
import {
  resolveBusinessContextFromModule,
  runModuleAiJsonTask,
  type ModulePlatformContext,
} from "@/services/ai-engine-bridge.service";

const MODULE_NAME = "integrations";

function toModulePlatform(context: IntegrationPlatformContext): ModulePlatformContext {
  return {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  };
}

async function runIntegrationAiInference<T extends Record<string, unknown>>(
  context: IntegrationPlatformContext,
  task: string,
  data: Record<string, unknown>,
  instructions?: string,
): Promise<T | null> {
  const platform = await resolveBusinessContextFromModule(toModulePlatform(context));
  return runModuleAiJsonTask<T>(platform, {
    module: MODULE_NAME,
    task,
    context: data,
    instructions,
  });
}

export async function buildIntegrationAiContext(context: IntegrationPlatformContext): Promise<IntegrationAiContext> {
  const record = await integrationService.getRecord(context);
  return {
    ...record.aiContext,
    summary: getIntegrationSummary(record),
    connectedCount: getConnectedCount(record),
    lastGeneratedAt: new Date().toISOString(),
  };
}

export async function recommendIntegrationForAi(
  context: IntegrationPlatformContext,
  input?: { category?: IntegrationCategory },
): Promise<Record<string, unknown>> {
  const record = await integrationService.getRecord(context);
  const category = input?.category ?? INTEGRATION_CATEGORIES.PAYMENT;
  const connectedSlugs = new Set(
    record.integrations
      .filter((integration) => integration.status === "connected")
      .map((integration) => integration.name.toLowerCase()),
  );

  const dataContext = {
    category,
    connectedSlugs: [...connectedSlugs],
    providers: record.providers
      .filter((provider) => provider.category === category)
      .map((provider) => ({
        id: provider.id,
        name: provider.name,
        isAvailable: provider.isAvailable,
      })),
    recommendedProviderId: record.aiContext.recommendedProviderId,
  };

  const aiResult = await runIntegrationAiInference<Record<string, unknown>>(
    context,
    "recommendIntegration",
    dataContext,
    "Recommend integration provider. Return JSON with category, recommendedProviderId, recommendedProviderName, and reason.",
  );

  if (aiResult) {
    return aiResult;
  }

  const recommended =
    record.providers.find(
      (provider) => provider.category === category && provider.isAvailable && !connectedSlugs.has(provider.name.toLowerCase()),
    ) ?? record.providers.find((provider) => provider.id === record.aiContext.recommendedProviderId);

  return {
    category,
    recommendedProviderId: recommended?.id ?? null,
    recommendedProviderName: recommended?.name ?? null,
  };
}

export async function generateApiKeyForAi(
  context: IntegrationPlatformContext,
  input: { name: string; scopes?: string[] },
): Promise<Record<string, unknown>> {
  const { apiKey, secret } = await integrationService.createApiKey(context, {
    name: input.name,
    scopes: input.scopes ?? ["orders.read", "menu.read"],
    rateLimitPerHour: 1000,
  });

  return {
    apiKeyId: apiKey.id,
    keyPrefix: apiKey.keyPrefix,
    secret,
    scopes: apiKey.scopes,
    status: apiKey.status,
  };
}

export async function analyzeApiUsageForAi(context: IntegrationPlatformContext): Promise<Record<string, unknown>> {
  const record = await integrationService.getRecord(context);
  const analytics = record.developerAnalytics;
  const dataContext = {
    totalRequests: analytics.totalRequests,
    errorRatePercent: getErrorRatePercent(analytics),
    averageLatencyMs: analytics.averageLatencyMs,
    topEndpoints: getTopApiEndpoints(analytics),
    usageByEndpoint: record.apiUsage.map((usage) => ({
      endpoint: usage.endpoint,
      requestCount: usage.requestCount,
      errorCount: usage.errorCount,
      averageLatencyMs: usage.averageLatencyMs,
    })),
  };

  const aiResult = await runIntegrationAiInference<Record<string, unknown>>(
    context,
    "analyzeApiUsage",
    dataContext,
    "Analyze API usage. Return JSON with totalRequests, errorRatePercent, averageLatencyMs, topEndpoints, usageByEndpoint, and insights.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function detectFailedWebhooksForAi(context: IntegrationPlatformContext): Promise<Record<string, unknown>> {
  const failed = await integrationService.getFailedWebhookEvents(context);
  const dataContext = {
    failedCount: failed.length,
    events: failed.map((event) => ({
      eventId: event.id,
      webhookId: event.webhookId,
      eventType: event.eventType,
      status: event.status,
      attemptCount: event.attemptCount,
      responseStatusCode: event.responseStatusCode,
    })),
  };

  const aiResult = await runIntegrationAiInference<Record<string, unknown>>(
    context,
    "detectFailedWebhooks",
    dataContext,
    "Detect failed webhooks. Return JSON with failedCount, events, and recommendedActions.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function suggestRetryForAi(
  context: IntegrationPlatformContext,
  input?: { eventId?: string },
): Promise<Record<string, unknown>> {
  const record = await integrationService.getRecord(context);
  const pending = getPendingRetryEvents(record.webhookEvents);
  const event = input?.eventId
    ? record.webhookEvents.find((item) => item.id === input.eventId)
    : pending[0];

  if (!event) {
    return { success: false, error: "No retryable events found" };
  }

  const dataContext = {
    eventId: event.id,
    attemptCount: event.attemptCount,
    status: event.status,
    eventType: event.eventType,
    nextRetryAt: event.nextRetryAt,
    responseStatusCode: event.responseStatusCode,
  };

  const aiResult = await runIntegrationAiInference<Record<string, unknown>>(
    context,
    "suggestRetry",
    dataContext,
    "Suggest webhook retry action. Return JSON with eventId, attemptCount, suggestion, and nextRetryAt.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    eventId: event.id,
    attemptCount: event.attemptCount,
    nextRetryAt: event.nextRetryAt,
  };
}

export async function explainApiErrorsForAi(
  context: IntegrationPlatformContext,
  input?: { requestId?: string },
): Promise<Record<string, unknown>> {
  const record = await integrationService.getRecord(context);
  const errorResponses = record.apiResponses.filter((response) => response.errorCode !== null);
  const request = input?.requestId
    ? record.apiRequests.find((item) => item.id === input.requestId)
    : record.apiRequests.find((item) => item.statusCode >= 400);

  if (!request) {
    return { success: false, error: "No API errors found" };
  }

  const response = record.apiResponses.find((item) => item.requestId === request.id) ?? errorResponses[0];

  return {
    requestId: request.id,
    statusCode: request.statusCode,
    errorCode: response?.errorCode ?? null,
    errorMessage: response?.errorMessage ?? null,
    path: request.path,
    explanation: explainErrorCode(response?.errorCode ?? null, request.statusCode),
  };
}

function explainErrorCode(errorCode: string | null, statusCode: number): string {
  if (errorCode === "rate_limit_exceeded") {
    return "API rate limit exceeded — reduce request frequency or increase limits";
  }
  if (statusCode === 401) return "Authentication failed — verify API key or OAuth token";
  if (statusCode === 403) return "Insufficient scopes for this endpoint";
  if (statusCode === 429) return "Too many requests — implement exponential backoff";
  return `HTTP ${statusCode} — review payload, scopes, and endpoint version`;
}

export async function recommendRateLimitsForAi(context: IntegrationPlatformContext): Promise<Record<string, unknown>> {
  const record = await integrationService.getRecord(context);
  const recommendations = record.apiUsage
    .map((usage) => {
      const rateLimit = record.rateLimits.find((policy) => policy.apiKeyId === usage.apiKeyId);
      return rateLimit ? recommendRateLimit(usage, rateLimit) : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const dataContext = {
    usageCount: record.apiUsage.length,
    currentRecommendations: recommendations,
    apiUsage: record.apiUsage.slice(0, 20),
  };

  const aiResult = await runIntegrationAiInference<Record<string, unknown>>(
    context,
    "recommendRateLimits",
    dataContext,
    "Recommend API rate limits. Return JSON with recommendations array.",
  );

  if (aiResult) {
    return aiResult;
  }

  return { recommendations };
}

export async function generateIntegrationMappingForAi(
  context: IntegrationPlatformContext,
  input: { integrationId: string; sourceEntity: string; targetEntity: string },
): Promise<Record<string, unknown>> {
  const integration = await integrationService.getIntegrationById(context, input.integrationId);
  if (!integration) {
    return { success: false, error: "Integration not found" };
  }

  const record = await integrationService.getRecord(context);
  const existingMapping = record.mappings.find(
    (mapping) => mapping.integrationId === input.integrationId && mapping.sourceEntity === input.sourceEntity,
  );

  const dataContext = {
    integrationId: input.integrationId,
    integrationName: integration.name,
    sourceEntity: input.sourceEntity,
    targetEntity: input.targetEntity,
    existingFieldMappings: existingMapping?.fieldMappings,
  };

  const aiResult = await runIntegrationAiInference<Record<string, unknown>>(
    context,
    "generateIntegrationMapping",
    dataContext,
    "Generate integration field mapping. Return JSON with mappingId or draft (sourceEntity, targetEntity, fieldMappings).",
  );

  if (aiResult) {
    return aiResult;
  }

  const fieldMappings = existingMapping?.fieldMappings ?? [
    { sourceField: "id", targetField: "ExternalId", transform: null },
    { sourceField: "name", targetField: "Name", transform: null },
    { sourceField: "createdAt", targetField: "CreatedDate", transform: "iso_to_date" },
  ];

  const mapping = await integrationService.createIntegrationMapping(context, {
    integrationId: input.integrationId,
    sourceEntity: input.sourceEntity,
    targetEntity: input.targetEntity,
    fieldMappings,
  });

  return {
    mappingId: mapping.id,
    integrationId: input.integrationId,
    sourceEntity: input.sourceEntity,
    targetEntity: input.targetEntity,
    fieldMappings: mapping.fieldMappings,
  };
}

export async function optimizeApiUsageForAi(context: IntegrationPlatformContext): Promise<Record<string, unknown>> {
  const record = await integrationService.getRecord(context);
  const analytics = record.developerAnalytics;
  const highErrorEndpoints = record.apiUsage.filter((usage) => usage.errorCount > 0);

  return {
    totalRequests: analytics.totalRequests,
    errorRatePercent: getErrorRatePercent(analytics),
    recommendations: highErrorEndpoints.length > 0
      ? ["Cache read-heavy endpoints", "Batch write operations", "Review scopes on high-error routes"]
      : ["Usage patterns are healthy — consider caching for top endpoints"],
    topEndpoints: analytics.topEndpoints,
  };
}

export async function monitorApiHealthForAi(context: IntegrationPlatformContext): Promise<Record<string, unknown>> {
  const record = await integrationService.getRecord(context);
  const unhealthyIntegrations = record.integrations.filter(
    (integration) => integration.status === "error" || integration.status === "disconnected",
  );

  return {
    connectedCount: record.integrations.filter((integration) => integration.status === "connected").length,
    unhealthyCount: unhealthyIntegrations.length,
    failedWebhooks: record.webhookEvents.filter((event) => event.status === "failed").length,
    activeApiKeys: record.apiKeys.filter((key) => key.status === "active").length,
    healthScore: Math.max(
      0,
      100 - unhealthyIntegrations.length * 10 - record.developerAnalytics.errorRateBps / 100,
    ),
    integrations: unhealthyIntegrations.map((integration) => ({
      id: integration.id,
      name: integration.name,
      status: integration.status,
    })),
  };
}

export async function analyzeWebhookFailuresForAi(context: IntegrationPlatformContext): Promise<Record<string, unknown>> {
  return detectFailedWebhooksForAi(context);
}
