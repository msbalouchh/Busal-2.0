export {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  DELIVERY_STATUSES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_SCOPES,
  NOTIFICATION_EVENT_SOURCES,
  QUEUE_STATUSES,
  SCHEDULE_TYPES,
  NOTIFICATION_AI_TOOL_IDS,
  NOTIFICATION_PERMISSIONS,
  NOTIFICATION_CHANNEL_LABELS,
  NOTIFICATION_STATUS_LABELS,
  DELIVERY_STATUS_LABELS,
  NOTIFICATION_PRIORITY_LABELS,
  type NotificationChannel,
  type NotificationStatus,
  type DeliveryStatus,
  type NotificationPriority,
  type NotificationScope,
  type NotificationEventSource,
  type QueueStatus,
  type ScheduleType,
  type NotificationAiToolId,
  type NotificationPermission,
} from "@/modules/notifications/constants/notification-status";

export {
  NOTIFICATION_MODULE_PERMISSIONS,
  type NotificationModulePermissionCode,
} from "@/modules/notifications/constants/permissions";

export {
  NOTIFICATION_INTEGRATION_POINTS,
  type NotificationIntegrationPoint,
} from "@/modules/notifications/constants/integration-points";

export {
  NOTIFICATION_PLATFORM_ROUTES,
  NOTIFICATION_PLATFORM_NAV_ITEMS,
} from "@/modules/notifications/constants/platform-routes";

export type * from "@/modules/notifications/types/notification-platform";

export * from "@/modules/notifications/utils/notification-selectors";
export * from "@/modules/notifications/utils/notification-delivery-utils";
export * from "@/modules/notifications/utils/notification-schedule-utils";

export {
  NotificationRepository,
  notificationRepository,
} from "@/modules/notifications/repository/notification-repository";

export {
  NotificationService,
  notificationService,
} from "@/modules/notifications/services/notification.service";

export {
  buildNotificationPlatformContext,
  buildNotificationPlatformSnapshot,
  getNotificationPlatformSummary,
  type NotificationPlatformSnapshot,
  type NotificationPlatformInput,
} from "@/modules/notifications/services/notification-platform.service";

export {
  getNotificationsOverviewContext,
  getNotificationsPlatformModuleContext,
  getNotificationsInboxContext,
  getNotificationsTemplatesContext,
  getNotificationsRulesContext,
  getNotificationsChannelsContext,
  getNotificationsDeliveriesContext,
  getNotificationsPreferencesContext,
  getNotificationsAuditContext,
} from "@/modules/notifications/lib/get-notifications-context";

export { NotificationProvider } from "@/modules/notifications/providers/notification-provider";
export { NotificationContext } from "@/modules/notifications/contexts/notification-context";

export {
  useNotifications,
  useNotificationContext,
} from "@/modules/notifications/hooks/use-notifications";
export { useNotificationPreferences } from "@/modules/notifications/hooks/use-notification-preferences";
export { useNotificationQueue } from "@/modules/notifications/hooks/use-notification-queue";

export { NotificationChannelBadge } from "@/modules/notifications/components/notification-channel-badge";
export { DeliveryStatusBadge } from "@/modules/notifications/components/delivery-status-badge";
export { NotificationPriorityBadge } from "@/modules/notifications/components/notification-priority-badge";
export { NotificationManagementLoading } from "@/modules/notifications/components/notification-management-loading";
export { NotificationManagementEmpty } from "@/modules/notifications/components/notification-management-empty";
export { NotificationManagementError } from "@/modules/notifications/components/notification-management-error";
export { NotificationPlatformOverview } from "@/modules/notifications/components/notification-platform-overview";

export {
  registerNotificationAiTools,
  NOTIFICATION_AI_TOOLS,
  buildNotificationAiContext,
  generateNotificationForAi,
  recommendChannelForAi,
  scheduleNotificationForAi,
  predictDeliveryForAi,
  detectNotificationFailuresForAi,
  optimizeSendTimeForAi,
  summarizeNotificationsForAi,
  generateTemplatesForAi,
  predictCustomerEngagementForAi,
  recommendNotificationPriorityForAi,
  optimizeCampaignForAi,
  analyzeDeliveryFailuresForAi,
} from "@/modules/notifications/ai";

export {
  sendNotificationAction,
  sendBulkNotificationsAction,
  markNotificationReadAction,
  createNotificationTemplateAction,
  createNotificationRuleAction,
  createNotificationCampaignAction,
  updateNotificationPreferenceAction,
  retryNotificationDeliveryAction,
  handleNotificationWebhookAction,
} from "@/modules/notifications/actions/notification-platform-actions";
