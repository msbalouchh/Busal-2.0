import { integrationRepository } from "@/modules/integrations/repository/integration-repository";
import type { IntegrationTenantScope } from "@/modules/integrations/lib/integration-scope";
import type {
  ApiKey,
  CreateApiKeyInput,
  CreateWebhookInput,
  Integration,
  IntegrationPlatformContext,
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

function resolveScope(context: IntegrationPlatformContext): IntegrationTenantScope {
  return {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  };
}

/** Domain service for integration operations. */
export class IntegrationService {
  async getRecord(context: IntegrationPlatformContext): Promise<IntegrationRecord> {
    return integrationRepository.getRecord(resolveScope(context));
  }

  async getIntegrationById(context: IntegrationPlatformContext, integrationId: string): Promise<Integration | null> {
    return integrationRepository.findIntegrationById(resolveScope(context), integrationId);
  }

  async searchIntegrations(
    context: IntegrationPlatformContext,
    query: IntegrationSearchQuery | IntegrationSearchSchemaInput = {},
  ): Promise<IntegrationSearchResult<Integration>> {
    return integrationRepository.searchIntegrations(resolveScope(context), query);
  }

  async getConnectedIntegrations(context: IntegrationPlatformContext): Promise<Integration[]> {
    return integrationRepository.getConnectedIntegrations(resolveScope(context));
  }

  async getFailedWebhookEvents(context: IntegrationPlatformContext): Promise<IntegrationRecord["webhookEvents"]> {
    return integrationRepository.getFailedWebhookEvents(resolveScope(context));
  }

  async createApiKey(
    context: IntegrationPlatformContext,
    input: CreateApiKeyInput | CreateApiKeySchemaInput,
  ): Promise<{ apiKey: ApiKey; secret: string }> {
    return integrationRepository.createApiKey(resolveScope(context), input);
  }

  async revokeApiKey(context: IntegrationPlatformContext, apiKeyId: string): Promise<boolean> {
    return integrationRepository.revokeApiKey(resolveScope(context), apiKeyId);
  }

  async rotateApiKey(
    context: IntegrationPlatformContext,
    apiKeyId: string,
  ): Promise<{ apiKey: ApiKey; secret: string }> {
    return integrationRepository.rotateApiKey(resolveScope(context), apiKeyId);
  }

  async createWebhook(
    context: IntegrationPlatformContext,
    input: CreateWebhookInput | CreateWebhookSchemaInput,
  ): Promise<Webhook> {
    return integrationRepository.createWebhook(resolveScope(context), input);
  }

  async updateWebhook(
    context: IntegrationPlatformContext,
    webhookId: string,
    input: Partial<CreateWebhookInput> & { isActive?: boolean },
  ): Promise<Webhook | null> {
    return integrationRepository.updateWebhook(resolveScope(context), webhookId, input);
  }

  async deleteWebhook(context: IntegrationPlatformContext, webhookId: string): Promise<boolean> {
    return integrationRepository.deleteWebhook(resolveScope(context), webhookId);
  }

  async retryWebhookDelivery(context: IntegrationPlatformContext, input: RetryWebhookSchemaInput): Promise<boolean> {
    return integrationRepository.retryWebhookDelivery(resolveScope(context), input);
  }

  async verifyWebhookSignature(
    context: IntegrationPlatformContext,
    input: WebhookVerificationSchemaInput,
  ): Promise<boolean> {
    return integrationRepository.verifyWebhookSignature(resolveScope(context), input);
  }

  async connectIntegration(
    context: IntegrationPlatformContext,
    input: ConnectIntegrationSchemaInput,
  ): Promise<Integration> {
    return integrationRepository.connectIntegration(resolveScope(context), input);
  }

  async disconnectIntegration(context: IntegrationPlatformContext, integrationId: string): Promise<boolean> {
    return integrationRepository.disconnectIntegration(resolveScope(context), integrationId);
  }

  async runHealthCheck(context: IntegrationPlatformContext, integrationId: string): Promise<Integration | null> {
    return integrationRepository.runHealthCheck(resolveScope(context), integrationId);
  }

  async createDeveloperApplication(
    context: IntegrationPlatformContext,
    input: CreateDeveloperApplicationSchemaInput,
  ) {
    return integrationRepository.createDeveloperApplication(resolveScope(context), input);
  }

  async createDeveloperToken(context: IntegrationPlatformContext, input: CreateDeveloperTokenSchemaInput) {
    return integrationRepository.createDeveloperToken(resolveScope(context), input);
  }

  async revokeDeveloperToken(context: IntegrationPlatformContext, tokenId: string): Promise<boolean> {
    return integrationRepository.revokeDeveloperToken(resolveScope(context), tokenId);
  }

  async createIntegrationMapping(
    context: IntegrationPlatformContext,
    input: CreateIntegrationMappingSchemaInput,
  ) {
    return integrationRepository.createIntegrationMapping(resolveScope(context), input);
  }

  async getActiveApiKeys(context: IntegrationPlatformContext): Promise<ApiKey[]> {
    return integrationRepository.getActiveApiKeys(resolveScope(context));
  }
}

export const integrationService = new IntegrationService();

export { resolveIntegrationScope, toIntegrationPlatformContext } from "@/modules/integrations/lib/integration-scope";
