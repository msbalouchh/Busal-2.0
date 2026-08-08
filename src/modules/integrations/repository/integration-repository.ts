import "server-only";

import { createHash, randomBytes } from "node:crypto";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PROVIDER_CATALOG,
  createDeveloperTokenRecord,
  createMappingRecord,
  defaultBranchIntegrationMeta,
  mapIntegrationAggregate,
  toPrismaCategory,
  type StoredIntegrationBranchMeta,
} from "@/modules/integrations/lib/integration-mappers";
import type { IntegrationTenantScope } from "@/modules/integrations/lib/integration-scope";
import type {
  ApiKey,
  CreateApiKeyInput,
  CreateWebhookInput,
  Integration,
  IntegrationRecord,
  IntegrationSearchQuery,
  IntegrationSearchResult,
  Webhook,
} from "@/modules/integrations/types/integration-platform";
import type {
  ConnectIntegrationSchemaInput,
  CreateApiKeySchemaInput,
  CreateDeveloperApplicationSchemaInput,
  CreateDeveloperTokenSchemaInput,
  CreateIntegrationMappingSchemaInput,
  CreateWebhookSchemaInput,
  IntegrationSearchSchemaInput,
  RetryWebhookSchemaInput,
  WebhookVerificationSchemaInput,
} from "@/modules/integrations/validation/integration-schemas";
import { getNextRetryAt } from "@/modules/integrations/utils/integration-webhook-utils";

const DEFAULT_PAGE_SIZE = 25;

function paginate<T>(items: T[], page: number, pageSize: number): IntegrationSearchResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, page: safePage, pageSize, totalPages };
}

function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

function generateClientId(): string {
  return `busal_${randomBytes(8).toString("hex")}`;
}

function generateWebhookSecret(): string {
  return `whsec_${randomBytes(16).toString("hex")}`;
}

/** Prisma-backed integration repository with tenant scoping. */
export class IntegrationRepository {
  private async loadBranchMeta(scope: IntegrationTenantScope): Promise<StoredIntegrationBranchMeta> {
    const settings = await prisma.branchSettings.findUnique({
      where: { branchId: scope.branchId },
      select: { settings: true },
    });
    const raw = settings?.settings;
    if (raw && typeof raw === "object" && raw !== null && "integrationOperations" in raw) {
      return (raw as unknown as { integrationOperations: StoredIntegrationBranchMeta }).integrationOperations;
    }
    return defaultBranchIntegrationMeta(scope);
  }

  private async saveBranchMeta(scope: IntegrationTenantScope, meta: StoredIntegrationBranchMeta): Promise<void> {
    const existing = await prisma.branchSettings.findUnique({
      where: { branchId: scope.branchId },
      select: { settings: true },
    });
    const settingsObject =
      existing?.settings && typeof existing.settings === "object" && existing.settings !== null
        ? (existing.settings as Record<string, unknown>)
        : {};

    await prisma.branchSettings.upsert({
      where: { branchId: scope.branchId },
      create: {
        branchId: scope.branchId,
        settings: { ...settingsObject, integrationOperations: meta } as unknown as Prisma.InputJsonValue,
      },
      update: {
        settings: { ...settingsObject, integrationOperations: meta } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private async ensureDefaultProviders(businessId: string): Promise<void> {
    await Promise.all(
      DEFAULT_PROVIDER_CATALOG.map((provider) =>
        prisma.integrationProvider.upsert({
          where: { businessId_slug: { businessId, slug: provider.slug } },
          create: {
            businessId,
            slug: provider.slug,
            name: provider.name,
            category: toPrismaCategory(provider.category),
            status: "INACTIVE",
            configuration: {
              authType: provider.authType,
              supportedFeatures: provider.supportedFeatures,
              documentationUrl: provider.documentationUrl,
            },
          },
          update: {
            name: provider.name,
            category: toPrismaCategory(provider.category),
          },
        }),
      ),
    );
  }

  private async loadAggregate(scope: IntegrationTenantScope): Promise<IntegrationRecord> {
    await this.ensureDefaultProviders(scope.businessId);

    const [
      dbProviders,
      connections,
      iamApiKeys,
      webhookRegistrations,
      webhookDeliveries,
      applications,
      syncJobs,
      logs,
      apiRequestLogs,
      platformRequestLogs,
      rateLimitPolicies,
      meta,
    ] = await Promise.all([
      prisma.integrationProvider.findMany({ where: { businessId: scope.businessId } }),
      prisma.integrationConnection.findMany({
        where: { businessId: scope.businessId },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.iamApiKey.findMany({
        where: { businessId: scope.businessId, revokedAt: null },
        orderBy: { createdAt: "desc" },
      }),
      prisma.apiWebhookRegistration.findMany({
        where: { businessId: scope.businessId },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.apiWebhookDelivery.findMany({
        where: { businessId: scope.businessId },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.platformApiApplication.findMany({
        where: { businessId: scope.businessId },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.integrationSyncJob.findMany({
        where: { businessId: scope.businessId },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.integrationLog.findMany({
        where: { businessId: scope.businessId },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.apiRequestLog.findMany({
        where: { businessId: scope.businessId },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.platformApiRequestLog.findMany({
        where: { businessId: scope.businessId },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.apiRateLimitPolicy.findMany({
        where: { businessId: scope.businessId },
      }),
      this.loadBranchMeta(scope),
    ]);

    return mapIntegrationAggregate(
      scope,
      dbProviders,
      connections,
      iamApiKeys,
      webhookRegistrations,
      webhookDeliveries,
      applications,
      syncJobs,
      logs,
      apiRequestLogs,
      platformRequestLogs,
      rateLimitPolicies,
      meta,
    );
  }

  async getRecord(scope: IntegrationTenantScope): Promise<IntegrationRecord> {
    return this.loadAggregate(scope);
  }

  async findIntegrationById(scope: IntegrationTenantScope, integrationId: string): Promise<Integration | null> {
    const record = await this.loadAggregate(scope);
    return record.integrations.find((integration) => integration.id === integrationId) ?? null;
  }

  async searchIntegrations(
    scope: IntegrationTenantScope,
    query: IntegrationSearchQuery | IntegrationSearchSchemaInput = {},
  ): Promise<IntegrationSearchResult<Integration>> {
    const record = await this.loadAggregate(scope);
    let results = [...record.integrations];

    if (query.category) {
      results = results.filter((integration) => integration.category === query.category);
    }
    if (query.status) {
      results = results.filter((integration) => integration.status === query.status);
    }
    if (query.query) {
      const term = query.query.toLowerCase();
      results = results.filter((integration) => integration.name.toLowerCase().includes(term));
    }

    if (query.sortBy === "name") {
      results.sort((a, b) => a.name.localeCompare(b.name) * (query.sortOrder === "desc" ? -1 : 1));
    } else {
      results.sort(
        (a, b) =>
          (new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) *
          (query.sortOrder === "asc" ? -1 : 1),
      );
    }

    const pageSize = query.limit ?? query.pageSize ?? DEFAULT_PAGE_SIZE;
    const page = query.page ?? 1;
    return paginate(results, page, pageSize);
  }

  async getConnectedIntegrations(scope: IntegrationTenantScope): Promise<Integration[]> {
    const record = await this.loadAggregate(scope);
    return record.integrations.filter((integration) => integration.status === "connected");
  }

  async getFailedWebhookEvents(scope: IntegrationTenantScope): Promise<IntegrationRecord["webhookEvents"]> {
    const record = await this.loadAggregate(scope);
    return record.webhookEvents.filter(
      (event) => event.status === "failed" || event.status === "retrying",
    );
  }

  async createApiKey(
    scope: IntegrationTenantScope,
    input: CreateApiKeyInput | CreateApiKeySchemaInput,
  ): Promise<{ apiKey: ApiKey; secret: string }> {
    const secret = `busal_live_${randomBytes(24).toString("hex")}`;
    const keyPrefix = secret.slice(0, 16);

    const created = await prisma.iamApiKey.create({
      data: {
        businessId: scope.businessId,
        userId: scope.userId,
        keyType: "BUSINESS",
        name: input.name,
        keyPrefix,
        keyHash: hashSecret(secret),
        permissions: input.scopes,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        createdById: scope.userId,
      },
    });

    await prisma.apiRateLimitPolicy.upsert({
      where: {
        businessId_scope_scopeIdentifier: {
          businessId: scope.businessId,
          scope: "API_KEY",
          scopeIdentifier: `key:${created.id}`,
        },
      },
      create: {
        businessId: scope.businessId,
        name: `${input.name} rate limit`,
        scope: "API_KEY",
        scopeIdentifier: `key:${created.id}`,
        requestsPerMinute: Math.max(1, Math.round((input.rateLimitPerHour ?? 1000) / 60)),
        burstLimit: 20,
      },
      update: {
        requestsPerMinute: Math.max(1, Math.round((input.rateLimitPerHour ?? 1000) / 60)),
      },
    });

    const record = await this.loadAggregate(scope);
    const apiKey = record.apiKeys.find((key) => key.id === created.id);
    if (!apiKey) throw new Error("Failed to load created API key");
    return { apiKey, secret };
  }

  async revokeApiKey(scope: IntegrationTenantScope, apiKeyId: string): Promise<boolean> {
    const key = await prisma.iamApiKey.findFirst({
      where: { id: apiKeyId, businessId: scope.businessId },
    });
    if (!key) return false;

    await prisma.iamApiKey.update({
      where: { id: apiKeyId },
      data: { revokedAt: new Date() },
    });
    return true;
  }

  async rotateApiKey(scope: IntegrationTenantScope, apiKeyId: string): Promise<{ apiKey: ApiKey; secret: string }> {
    const existing = await prisma.iamApiKey.findFirst({
      where: { id: apiKeyId, businessId: scope.businessId, revokedAt: null },
    });
    if (!existing) throw new Error("API key not found");

    await prisma.iamApiKey.update({
      where: { id: apiKeyId },
      data: { revokedAt: new Date() },
    });

    return this.createApiKey(scope, {
      name: `${existing.name} (rotated)`,
      scopes: existing.permissions,
    });
  }

  async createWebhook(
    scope: IntegrationTenantScope,
    input: CreateWebhookInput | CreateWebhookSchemaInput,
  ): Promise<Webhook> {
    const secret = generateWebhookSecret();
    const registration = await prisma.apiWebhookRegistration.create({
      data: {
        businessId: scope.businessId,
        name: input.name,
        url: input.url,
        secret,
        events: input.eventTypes,
        retryPolicy: { maxAttempts: 5, backoffMs: 1000 },
        isActive: true,
      },
    });

    const record = await this.loadAggregate(scope);
    const webhook = record.webhooks.find((item) => item.id === registration.id);
    if (!webhook) throw new Error("Failed to load created webhook");
    return webhook;
  }

  async updateWebhook(
    scope: IntegrationTenantScope,
    webhookId: string,
    input: Partial<CreateWebhookInput> & { isActive?: boolean },
  ): Promise<Webhook | null> {
    const existing = await prisma.apiWebhookRegistration.findFirst({
      where: { id: webhookId, businessId: scope.businessId },
    });
    if (!existing) return null;

    await prisma.apiWebhookRegistration.update({
      where: { id: webhookId },
      data: {
        name: input.name,
        url: input.url,
        events: input.eventTypes,
        isActive: input.isActive,
      },
    });

    const record = await this.loadAggregate(scope);
    return record.webhooks.find((webhook) => webhook.id === webhookId) ?? null;
  }

  async deleteWebhook(scope: IntegrationTenantScope, webhookId: string): Promise<boolean> {
    const existing = await prisma.apiWebhookRegistration.findFirst({
      where: { id: webhookId, businessId: scope.businessId },
    });
    if (!existing) return false;

    await prisma.apiWebhookRegistration.update({
      where: { id: webhookId },
      data: { isActive: false },
    });
    return true;
  }

  async retryWebhookDelivery(scope: IntegrationTenantScope, input: RetryWebhookSchemaInput): Promise<boolean> {
    const delivery = await prisma.apiWebhookDelivery.findFirst({
      where: { id: input.deliveryId, businessId: scope.businessId },
    });
    if (!delivery) return false;

    await prisma.apiWebhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "RETRYING",
        attemptCount: delivery.attemptCount + 1,
        nextRetryAt: new Date(getNextRetryAt(delivery.attemptCount)),
        errorMessage: null,
      },
    });

    await prisma.apiWebhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
        responseStatus: 200,
      },
    });

    return true;
  }

  async verifyWebhookSignature(
    scope: IntegrationTenantScope,
    input: WebhookVerificationSchemaInput,
  ): Promise<boolean> {
    const registration = await prisma.apiWebhookRegistration.findFirst({
      where: { id: input.webhookId, businessId: scope.businessId },
    });
    if (!registration) return false;

    const payload = JSON.stringify(input.payload);
    const expected = createHash("sha256")
      .update(`${input.timestamp ?? ""}.${payload}`)
      .update(registration.secret)
      .digest("hex");

    return expected === input.signature;
  }

  async connectIntegration(
    scope: IntegrationTenantScope,
    input: ConnectIntegrationSchemaInput,
  ): Promise<Integration> {
    const provider = await prisma.integrationProvider.findFirst({
      where: { businessId: scope.businessId, slug: input.providerSlug },
    });
    if (!provider) throw new Error("Integration provider not found");

    const connection = await prisma.integrationConnection.create({
      data: {
        businessId: scope.businessId,
        providerId: provider.id,
        displayName: input.displayName,
        status: "ACTIVE",
        credentials: JSON.stringify(input.credentials),
        configuration: input.configuration,
        lastSyncAt: new Date(),
      },
    });

    await prisma.integrationProvider.update({
      where: { id: provider.id },
      data: { status: "ACTIVE" },
    });

    await prisma.integrationLog.create({
      data: {
        businessId: scope.businessId,
        connectionId: connection.id,
        level: "INFO",
        message: `Connected ${input.displayName}`,
        metadata: { action: "connect", providerSlug: input.providerSlug, branchId: scope.branchId },
      },
    });

    const result = await this.findIntegrationById(scope, connection.id);
    if (!result) throw new Error("Failed to load connected integration");
    return result;
  }

  async disconnectIntegration(scope: IntegrationTenantScope, integrationId: string): Promise<boolean> {
    const connection = await prisma.integrationConnection.findFirst({
      where: { id: integrationId, businessId: scope.businessId },
    });
    if (!connection) return false;

    await prisma.integrationConnection.update({
      where: { id: integrationId },
      data: { status: "DISCONNECTED" },
    });

    await prisma.integrationLog.create({
      data: {
        businessId: scope.businessId,
        connectionId: integrationId,
        level: "WARN",
        message: "Integration disconnected",
        metadata: { action: "disconnect", branchId: scope.branchId },
      },
    });

    return true;
  }

  async runHealthCheck(scope: IntegrationTenantScope, integrationId: string): Promise<Integration | null> {
    const connection = await prisma.integrationConnection.findFirst({
      where: { id: integrationId, businessId: scope.businessId },
      include: { provider: true },
    });
    if (!connection) return null;

    const healthy = connection.credentials.length > 0;
    await prisma.integrationConnection.update({
      where: { id: integrationId },
      data: {
        status: healthy ? "ACTIVE" : "ERROR",
        lastSyncAt: new Date(),
      },
    });

    await prisma.integrationLog.create({
      data: {
        businessId: scope.businessId,
        connectionId: integrationId,
        level: healthy ? "INFO" : "ERROR",
        message: healthy ? "Health check passed" : "Health check failed — missing credentials",
        metadata: { action: "health_check", branchId: scope.branchId },
      },
    });

    return this.findIntegrationById(scope, integrationId);
  }

  async createDeveloperApplication(
    scope: IntegrationTenantScope,
    input: CreateDeveloperApplicationSchemaInput,
  ): Promise<IntegrationRecord["developerApplications"][number]> {
    const clientId = generateClientId();
    const clientSecret = randomBytes(24).toString("hex");

    const application = await prisma.platformApiApplication.create({
      data: {
        businessId: scope.businessId,
        name: input.name,
        description: input.description,
        clientId,
        clientSecret: hashSecret(clientSecret),
        createdBy: scope.userId,
      },
    });

    const record = await this.loadAggregate(scope);
    const mapped = record.developerApplications.find((app) => app.id === application.id);
    if (!mapped) throw new Error("Failed to load developer application");
    return mapped;
  }

  async createDeveloperToken(
    scope: IntegrationTenantScope,
    input: CreateDeveloperTokenSchemaInput,
  ): Promise<{ token: IntegrationRecord["developerTokens"][number]; secret: string }> {
    const application = await prisma.platformApiApplication.findFirst({
      where: { id: input.applicationId, businessId: scope.businessId },
    });
    if (!application) throw new Error("Developer application not found");

    const secret = `busal_dev_${randomBytes(20).toString("hex")}`;
    const meta = await this.loadBranchMeta(scope);
    const token = createDeveloperTokenRecord(scope, {
      applicationId: input.applicationId,
      tokenPrefix: secret.slice(0, 18),
      scopes: input.scopes,
      expiresAt: input.expiresAt,
      lastUsedAt: null,
      isRevoked: false,
    });

    meta.developerTokens.push(token);
    await this.saveBranchMeta(scope, meta);
    return { token, secret };
  }

  async revokeDeveloperToken(scope: IntegrationTenantScope, tokenId: string): Promise<boolean> {
    const meta = await this.loadBranchMeta(scope);
    const token = meta.developerTokens.find((item) => item.id === tokenId);
    if (!token) return false;

    token.isRevoked = true;
    await this.saveBranchMeta(scope, meta);
    return true;
  }

  async createIntegrationMapping(
    scope: IntegrationTenantScope,
    input: CreateIntegrationMappingSchemaInput,
  ): Promise<IntegrationRecord["mappings"][number]> {
    const meta = await this.loadBranchMeta(scope);
    const mapping = createMappingRecord(scope, {
      id: `map-${Date.now()}`,
      tenantId: scope.tenantId,
      integrationId: input.integrationId,
      sourceEntity: input.sourceEntity,
      targetEntity: input.targetEntity,
      fieldMappings: input.fieldMappings,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    meta.mappings.push(mapping);
    await this.saveBranchMeta(scope, meta);
    return mapping;
  }

  async getActiveApiKeys(scope: IntegrationTenantScope): Promise<ApiKey[]> {
    const record = await this.loadAggregate(scope);
    return record.apiKeys.filter((key) => key.status === "active");
  }
}

export const integrationRepository = new IntegrationRepository();
