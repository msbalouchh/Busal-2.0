import { integrationRepository } from "@/modules/integrations/repository/integration-repository";
import type {
  ApiKey,
  CreateApiKeyInput,
  CreateWebhookInput,
  Integration,
  IntegrationRecord,
  IntegrationSearchQuery,
  Webhook,
} from "@/modules/integrations/types/integration-platform";

/** Domain service for integration operations. */
export class IntegrationService {
  getRecord(): IntegrationRecord {
    return integrationRepository.getRecord();
  }

  getIntegrationById(integrationId: string): Integration | null {
    return integrationRepository.findIntegrationById(integrationId) ?? null;
  }

  searchIntegrations(query: IntegrationSearchQuery = {}): Integration[] {
    return integrationRepository.searchIntegrations(query);
  }

  getConnectedIntegrations(): Integration[] {
    return integrationRepository.getConnectedIntegrations();
  }

  getFailedWebhookEvents(): IntegrationRecord["webhookEvents"] {
    return integrationRepository.getFailedWebhookEvents();
  }

  createApiKey(input: CreateApiKeyInput): ApiKey {
    return integrationRepository.createApiKey(input);
  }

  createWebhook(input: CreateWebhookInput): Webhook {
    return integrationRepository.createWebhook(input);
  }

  getActiveApiKeys(): ApiKey[] {
    return integrationRepository.getActiveApiKeys();
  }
}

export const integrationService = new IntegrationService();
