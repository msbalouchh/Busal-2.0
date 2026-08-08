import { notificationRepository } from "@/modules/notifications/repository/notification-repository";
import { DOMAIN_EVENT_TYPES } from "@/modules/platform-orchestration/constants/domain-events";
import {
  moduleScopeFromPlatform,
  publishModuleDomainEvent,
} from "@/modules/platform-orchestration/lib/publish-module-event";
import {
  resolveNotificationScope,
  toNotificationPlatformContext,
  type NotificationTenantScope,
} from "@/modules/notifications/lib/notification-scope";
import type {
  CreateTemplateInput,
  Notification,
  NotificationPlatformContext,
  NotificationRecord,
  NotificationSearchQuery,
  NotificationSearchResult,
  NotificationTemplate,
  SendNotificationInput,
} from "@/modules/notifications/types/notification-platform";
import type {
  BulkNotificationSchemaInput,
  CreateCampaignSchemaInput,
  CreateRuleSchemaInput,
  CreateTemplateSchemaInput,
  NotificationSearchSchemaInput,
  RetryDeliverySchemaInput,
  SendNotificationSchemaInput,
  UpdatePreferenceSchemaInput,
  WebhookPayloadSchemaInput,
} from "@/modules/notifications/validation/notification-schemas";

function resolveScope(context: NotificationPlatformContext): NotificationTenantScope {
  return {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  };
}

/** Domain service for notification operations. */
export class NotificationService {
  async getRecord(context: NotificationPlatformContext): Promise<NotificationRecord> {
    return notificationRepository.getRecord(resolveScope(context));
  }

  async getNotificationById(context: NotificationPlatformContext, notificationId: string): Promise<Notification | null> {
    return notificationRepository.findNotificationById(resolveScope(context), notificationId);
  }

  async searchNotifications(
    context: NotificationPlatformContext,
    query: NotificationSearchQuery | NotificationSearchSchemaInput = {},
  ): Promise<NotificationSearchResult<Notification>> {
    return notificationRepository.searchNotifications(resolveScope(context), query);
  }

  async getUnreadNotifications(context: NotificationPlatformContext): Promise<Notification[]> {
    return notificationRepository.getUnreadNotifications(resolveScope(context));
  }

  async getPendingQueue(context: NotificationPlatformContext): Promise<NotificationRecord["queue"]> {
    return notificationRepository.getPendingQueue(resolveScope(context));
  }

  async getFailedDeliveries(context: NotificationPlatformContext): Promise<NotificationRecord["deliveries"]> {
    return notificationRepository.getFailedDeliveries(resolveScope(context));
  }

  async markAsRead(context: NotificationPlatformContext, notificationId: string): Promise<Notification | null> {
    return notificationRepository.markAsRead(resolveScope(context), notificationId);
  }

  async sendNotification(
    context: NotificationPlatformContext,
    input: SendNotificationInput | SendNotificationSchemaInput,
  ): Promise<Notification> {
    const notification = await notificationRepository.sendNotification(resolveScope(context), input);
    await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
      eventType: DOMAIN_EVENT_TYPES.NOTIFICATION_SENT,
      aggregateId: notification.id,
      payload: {
        notificationId: notification.id,
        channel: notification.channel,
        recipientId: notification.recipientId,
      },
    });
    return notification;
  }

  async sendBulkNotifications(context: NotificationPlatformContext, input: BulkNotificationSchemaInput): Promise<number> {
    return notificationRepository.sendBulkNotifications(resolveScope(context), input);
  }

  async retryDelivery(context: NotificationPlatformContext, input: RetryDeliverySchemaInput): Promise<boolean> {
    return notificationRepository.retryDelivery(resolveScope(context), input);
  }

  async handleWebhook(context: NotificationPlatformContext, input: WebhookPayloadSchemaInput): Promise<boolean> {
    return notificationRepository.handleWebhook(resolveScope(context), input);
  }

  async createTemplate(
    context: NotificationPlatformContext,
    input: CreateTemplateInput | CreateTemplateSchemaInput,
  ): Promise<NotificationTemplate> {
    return notificationRepository.createTemplate(resolveScope(context), input);
  }

  async getTemplates(context: NotificationPlatformContext): Promise<NotificationTemplate[]> {
    return notificationRepository.getTemplates(resolveScope(context));
  }

  async createRule(context: NotificationPlatformContext, input: CreateRuleSchemaInput) {
    return notificationRepository.createRule(resolveScope(context), input);
  }

  async updatePreference(context: NotificationPlatformContext, input: UpdatePreferenceSchemaInput) {
    return notificationRepository.updatePreference(resolveScope(context), input);
  }

  async createCampaign(context: NotificationPlatformContext, input: CreateCampaignSchemaInput) {
    return notificationRepository.createCampaign(resolveScope(context), input);
  }

  async deleteTemplate(context: NotificationPlatformContext, templateId: string): Promise<boolean> {
    return notificationRepository.deleteTemplate(resolveScope(context), templateId);
  }
}

export const notificationService = new NotificationService();

export { resolveNotificationScope, toNotificationPlatformContext };
