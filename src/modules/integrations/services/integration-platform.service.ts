import "server-only";

import type {
  IntegrationPlatformContext,
  IntegrationRecord,
} from "@/modules/integrations/types/integration-platform";
import { integrationRepository } from "@/modules/integrations/repository/integration-repository";
import type { IntegrationTenantScope } from "@/modules/integrations/lib/integration-scope";
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
  businessId: string;
  branchId: string;
  userId?: string;
}

export function buildIntegrationPlatformContext(input: IntegrationPlatformInput): IntegrationPlatformContext {
  return {
    tenantId: input.tenantId ?? input.businessId,
    workspaceId: input.workspaceId ?? input.businessId,
    businessId: input.businessId,
    branchId: input.branchId,
    userId: input.userId ?? "system",
  };
}

export async function buildIntegrationPlatformSnapshot(
  context: IntegrationPlatformContext,
): Promise<IntegrationPlatformSnapshot> {
  const scope: IntegrationTenantScope = {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  };

  const record = await integrationRepository.getRecord(scope);
  const failedEvents = record.webhookEvents.filter(
    (event) => event.status === "failed" || event.status === "retrying",
  );

  return {
    context,
    record,
    connectedCount: record.integrations.filter((integration) => integration.status === "connected").length,
    activeApiKeyCount: record.apiKeys.filter((key) => key.status === "active").length,
    activeWebhookCount: record.webhooks.filter((webhook) => webhook.isActive).length,
    failedWebhookEventCount: failedEvents.length,
    totalApiRequests: record.developerAnalytics.totalRequests,
    errorRateBps: record.developerAnalytics.errorRateBps,
  };
}

export async function getIntegrationPlatformSummary(context: IntegrationPlatformContext): Promise<string> {
  const snapshot = await buildIntegrationPlatformSnapshot(context);
  return getIntegrationSummary(snapshot.record);
}
