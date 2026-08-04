import { notificationRepository } from "@/modules/notifications/repository/notification-repository";
import type {
  CreateTemplateInput,
  Notification,
  NotificationRecord,
  NotificationSearchQuery,
  NotificationTemplate,
  SendNotificationInput,
} from "@/modules/notifications/types/notification-platform";

/** Domain service for notification operations. */
export class NotificationService {
  getRecord(): NotificationRecord {
    return notificationRepository.getRecord();
  }

  getNotificationById(notificationId: string): Notification | null {
    return notificationRepository.findNotificationById(notificationId) ?? null;
  }

  searchNotifications(query: NotificationSearchQuery = {}): Notification[] {
    return notificationRepository.searchNotifications(query);
  }

  getUnreadNotifications(): Notification[] {
    return notificationRepository.getUnreadNotifications();
  }

  getPendingQueue(): NotificationRecord["queue"] {
    return notificationRepository.getPendingQueue();
  }

  getFailedDeliveries(): NotificationRecord["deliveries"] {
    return notificationRepository.getFailedDeliveries();
  }

  markAsRead(notificationId: string): Notification | null {
    return notificationRepository.markAsRead(notificationId);
  }

  sendNotification(input: SendNotificationInput): Notification {
    return notificationRepository.sendNotification(input);
  }

  createTemplate(input: CreateTemplateInput): NotificationTemplate {
    return notificationRepository.createTemplate(input);
  }

  getTemplates(): NotificationTemplate[] {
    return notificationRepository.getTemplates();
  }
}

export const notificationService = new NotificationService();
