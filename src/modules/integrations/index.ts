export {
  INTEGRATION_CATEGORIES,
  INTEGRATION_STATUSES,
  API_KEY_STATUSES,
  WEBHOOK_STATUSES,
  WEBHOOK_EVENT_STATUSES,
  OAUTH_STATUSES,
  SYNC_JOB_STATUSES,
  API_METHODS,
  LOG_LEVELS,
  DEVELOPER_SCOPES,
  INTEGRATION_AI_TOOL_IDS,
  INTEGRATION_PERMISSIONS,
  INTEGRATION_CATEGORY_LABELS,
  INTEGRATION_STATUS_LABELS,
  WEBHOOK_EVENT_STATUS_LABELS,
  type IntegrationCategory,
  type IntegrationStatus,
  type ApiKeyStatus,
  type WebhookStatus,
  type WebhookEventStatus,
  type OAuthStatus,
  type SyncJobStatus,
  type ApiMethod,
  type LogLevel,
  type DeveloperScope,
  type IntegrationAiToolId,
  type IntegrationPermission,
} from "@/modules/integrations/constants/integration-status";

export {
  INTEGRATION_INTEGRATION_POINTS,
  type IntegrationIntegrationPoint,
} from "@/modules/integrations/constants/integration-points";

export {
  INTEGRATION_PLATFORM_ROUTES,
  INTEGRATION_PLATFORM_NAV_ITEMS,
} from "@/modules/integrations/constants/platform-routes";

export {
  DEFAULT_INTEGRATION_SCOPE,
  MOCK_INTEGRATION_RECORD,
} from "@/modules/integrations/constants/mock-data";

export type * from "@/modules/integrations/types/integration-platform";

export * from "@/modules/integrations/utils/integration-selectors";
export * from "@/modules/integrations/utils/integration-webhook-utils";
export * from "@/modules/integrations/utils/integration-rate-limit-utils";

export {
  IntegrationRepository,
  integrationRepository,
} from "@/modules/integrations/repository/integration-repository";

export {
  IntegrationService,
  integrationService,
} from "@/modules/integrations/services/integration.service";

export {
  buildIntegrationPlatformContext,
  buildIntegrationPlatformSnapshot,
  getDefaultIntegrationSnapshot,
  getIntegrationPlatformSummary,
  type IntegrationPlatformSnapshot,
  type IntegrationPlatformInput,
} from "@/modules/integrations/services/integration-platform.service";

export { IntegrationProvider } from "@/modules/integrations/providers/integration-provider";
export { IntegrationContext } from "@/modules/integrations/contexts/integration-context";

export {
  useIntegrations,
  useIntegrationContext,
} from "@/modules/integrations/hooks/use-integrations";
export { useIntegrationWebhooks } from "@/modules/integrations/hooks/use-integration-webhooks";
export { useIntegrationDeveloper } from "@/modules/integrations/hooks/use-integration-developer";

export { IntegrationCategoryBadge } from "@/modules/integrations/components/integration-category-badge";
export { IntegrationStatusBadge } from "@/modules/integrations/components/integration-status-badge";
export { WebhookEventStatusBadge } from "@/modules/integrations/components/webhook-event-status-badge";

export {
  registerIntegrationAiTools,
  INTEGRATION_AI_TOOLS,
  buildIntegrationAiContext,
  recommendIntegrationForAi,
  generateApiKeyForAi,
  analyzeApiUsageForAi,
  detectFailedWebhooksForAi,
  suggestRetryForAi,
  explainApiErrorsForAi,
  recommendRateLimitsForAi,
  generateIntegrationMappingForAi,
} from "@/modules/integrations/ai";
