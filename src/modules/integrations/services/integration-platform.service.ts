import { DEFAULT_INTEGRATION_SCOPE } from "@/modules/integrations/constants/mock-data";
import { integrationRepository } from "@/modules/integrations/repository/integration-repository";
import type {
  IntegrationPlatformContext,
  IntegrationRecord,
} from "@/modules/integrations/types/integration-platform";
import { getIntegrationSummary } from "@/modules/integrations/utils/integration-selectors";

export interface IntegrationPlatformSnapshot {
  context: IntegrationPlatformContext;
  record: IntegrationRecord;
  connectedCount: number;
  activeApiKeyCount: number;
  activeWebhookCount: number;
  failedWebhookEventCount: number;
  totalApiRequests: number;
  errorRateBps: number;
}

export interface IntegrationPlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId?: string;
  userId?: string;
}

export function buildIntegrationPlatformContext(
  input: IntegrationPlatformInput = {},
): IntegrationPlatformContext {
  return {
    tenantId: input.tenantId ?? DEFAULT_INTEGRATION_SCOPE.tenantId,
    workspaceId: input.workspaceId ?? DEFAULT_INTEGRATION_SCOPE.workspaceId,
    businessId: input.businessId ?? DEFAULT_INTEGRATION_SCOPE.businessId,
    userId: input.userId ?? DEFAULT_INTEGRATION_SCOPE.userId,
  };
}

export function buildIntegrationPlatformSnapshot(
  input: IntegrationPlatformInput = {},
): IntegrationPlatformSnapshot {
  const context = buildIntegrationPlatformContext(input);
  const record = integrationRepository.getRecord();
  const failedEvents = integrationRepository.getFailedWebhookEvents();

  return {
    context,
    record,
    connectedCount: integrationRepository.getConnectedIntegrations().length,
    activeApiKeyCount: integrationRepository.getActiveApiKeys().length,
    activeWebhookCount: record.webhooks.filter((w) => w.isActive).length,
    failedWebhookEventCount: failedEvents.length,
    totalApiRequests: record.developerAnalytics.totalRequests,
    errorRateBps: record.developerAnalytics.errorRateBps,
  };
}

export function getDefaultIntegrationSnapshot(): IntegrationPlatformSnapshot {
  return buildIntegrationPlatformSnapshot();
}

export function getIntegrationPlatformSummary(input: IntegrationPlatformInput = {}): string {
  const snapshot = buildIntegrationPlatformSnapshot(input);
  return getIntegrationSummary(snapshot.record);
}
