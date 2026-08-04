import { API_KEY_STATUSES } from "@/modules/integrations/constants/integration-status";
import {
  DEFAULT_INTEGRATION_SCOPE,
  MOCK_INTEGRATION_RECORD,
} from "@/modules/integrations/constants/mock-data";
import type {
  ApiKey,
  CreateApiKeyInput,
  CreateWebhookInput,
  Integration,
  IntegrationRecord,
  IntegrationSearchQuery,
  Webhook,
} from "@/modules/integrations/types/integration-platform";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateKeyPrefix(type: "live" | "test" | "dev"): string {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `busal_${type}_${suffix}`;
}

/** In-memory integration repository (mock only, no backend). */
export class IntegrationRepository {
  private record: IntegrationRecord = structuredClone(MOCK_INTEGRATION_RECORD);

  getRecord(): IntegrationRecord {
    return structuredClone(this.record);
  }

  findIntegrationById(integrationId: string): Integration | undefined {
    return this.record.integrations.find((i) => i.id === integrationId);
  }

  searchIntegrations(query: IntegrationSearchQuery = {}): Integration[] {
    let results = structuredClone(this.record.integrations);

    if (query.category) {
      results = results.filter((i) => i.category === query.category);
    }

    if (query.status) {
      results = results.filter((i) => i.status === query.status);
    }

    if (query.query) {
      const term = query.query.toLowerCase();
      results = results.filter((i) => i.name.toLowerCase().includes(term));
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  getConnectedIntegrations(): Integration[] {
    return this.record.integrations.filter((i) => i.status === "connected");
  }

  getFailedWebhookEvents(): IntegrationRecord["webhookEvents"] {
    return this.record.webhookEvents.filter(
      (e) => e.status === "failed" || e.status === "retrying",
    );
  }

  createApiKey(input: CreateApiKeyInput): ApiKey {
    const now = new Date().toISOString();
    const apiKey: ApiKey = {
      id: createId("key"),
      tenantId: DEFAULT_INTEGRATION_SCOPE.tenantId,
      businessId: DEFAULT_INTEGRATION_SCOPE.businessId,
      name: input.name,
      keyPrefix: generateKeyPrefix("live"),
      status: API_KEY_STATUSES.ACTIVE,
      scopes: input.scopes,
      rateLimitPerHour: input.rateLimitPerHour ?? 1000,
      expiresAt: input.expiresAt ?? null,
      lastUsedAt: null,
      createdByUserId: DEFAULT_INTEGRATION_SCOPE.userId,
      createdAt: now,
    };

    this.record.apiKeys.push(apiKey);
    return structuredClone(apiKey);
  }

  createWebhook(input: CreateWebhookInput): Webhook {
    const now = new Date().toISOString();
    const webhook: Webhook = {
      id: createId("wh"),
      tenantId: DEFAULT_INTEGRATION_SCOPE.tenantId,
      businessId: DEFAULT_INTEGRATION_SCOPE.businessId,
      name: input.name,
      url: input.url,
      status: "active",
      secret: `whsec_${Math.random().toString(36).slice(2, 14)}`,
      eventTypes: input.eventTypes,
      retryPolicy: { maxRetries: 3, backoffMs: 5000 },
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    this.record.webhooks.push(webhook);
    return structuredClone(webhook);
  }

  getActiveApiKeys(): ApiKey[] {
    return this.record.apiKeys.filter((k) => k.status === API_KEY_STATUSES.ACTIVE);
  }
}

export const integrationRepository = new IntegrationRepository();
