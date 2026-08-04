import {
  NOTIFICATION_STATUSES,
  QUEUE_STATUSES,
} from "@/modules/notifications/constants/notification-status";
import {
  DEFAULT_NOTIFICATION_SCOPE,
  MOCK_NOTIFICATION_RECORD,
} from "@/modules/notifications/constants/mock-data";
import type {
  CreateTemplateInput,
  Notification,
  NotificationRecord,
  NotificationSearchQuery,
  NotificationTemplate,
  SendNotificationInput,
} from "@/modules/notifications/types/notification-platform";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** In-memory notification repository (mock only, no backend). */
export class NotificationRepository {
  private record: NotificationRecord = structuredClone(MOCK_NOTIFICATION_RECORD);

  getRecord(): NotificationRecord {
    return structuredClone(this.record);
  }

  findNotificationById(notificationId: string): Notification | undefined {
    return this.record.notifications.find((n) => n.id === notificationId);
  }

  searchNotifications(query: NotificationSearchQuery = {}): Notification[] {
    let results = structuredClone(this.record.notifications);

    if (query.tenantId) {
      results = results.filter((n) => n.tenantId === query.tenantId);
    }

    if (query.businessId) {
      results = results.filter((n) => n.businessId === query.businessId);
    }

    if (query.branchId) {
      results = results.filter((n) => n.branchId === query.branchId);
    }

    if (query.channel) {
      results = results.filter((n) => n.channel === query.channel);
    }

    if (query.status) {
      results = results.filter((n) => n.status === query.status);
    }

    if (query.eventSource) {
      results = results.filter((n) => n.eventSource === query.eventSource);
    }

    if (query.isRead !== undefined) {
      results = results.filter((n) => n.isRead === query.isRead);
    }

    if (query.query) {
      const term = query.query.toLowerCase();
      results = results.filter(
        (n) => n.title.toLowerCase().includes(term) || n.body.toLowerCase().includes(term),
      );
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  getUnreadNotifications(): Notification[] {
    return this.record.notifications.filter((n) => !n.isRead);
  }

  getPendingQueue(): NotificationRecord["queue"] {
    return this.record.queue.filter(
      (q) => q.status === QUEUE_STATUSES.PENDING || q.status === QUEUE_STATUSES.RETRY,
    );
  }

  getFailedDeliveries(): NotificationRecord["deliveries"] {
    return this.record.deliveries.filter((d) => d.status === "failed" || d.status === "bounced");
  }

  markAsRead(notificationId: string): Notification | null {
    const notification = this.record.notifications.find((n) => n.id === notificationId);

    if (!notification) {
      return null;
    }

    const now = new Date().toISOString();
    notification.isRead = true;
    notification.readAt = now;
    notification.status = NOTIFICATION_STATUSES.READ;
    notification.updatedAt = now;

    this.record.history.push({
      id: createId("hist"),
      tenantId: notification.tenantId,
      notificationId,
      action: "read",
      channel: notification.channel,
      actorUserId: DEFAULT_NOTIFICATION_SCOPE.userId,
      details: "Marked as read",
      occurredAt: now,
    });

    return structuredClone(notification);
  }

  sendNotification(input: SendNotificationInput): Notification {
    const now = new Date().toISOString();
    const notificationId = createId("notif");
    const isScheduled = input.scheduledAt !== undefined && input.scheduledAt !== null;

    const notification: Notification = {
      id: notificationId,
      tenantId: DEFAULT_NOTIFICATION_SCOPE.tenantId,
      workspaceId: DEFAULT_NOTIFICATION_SCOPE.workspaceId,
      businessId: DEFAULT_NOTIFICATION_SCOPE.businessId,
      branchId: DEFAULT_NOTIFICATION_SCOPE.branchId,
      templateId: input.templateId ?? null,
      title: input.title,
      body: input.body,
      channel: input.channel,
      status: isScheduled ? NOTIFICATION_STATUSES.SCHEDULED : NOTIFICATION_STATUSES.QUEUED,
      priority: input.priority ?? "normal",
      scope: "business",
      eventSource: "system",
      eventKey: "notification.manual",
      recipientId: input.recipientId,
      isRead: false,
      readAt: null,
      scheduledAt: input.scheduledAt ?? null,
      sentAt: null,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };

    this.record.notifications.push(notification);

    this.record.queue.push({
      id: createId("queue"),
      tenantId: DEFAULT_NOTIFICATION_SCOPE.tenantId,
      notificationId,
      channel: input.channel,
      status: QUEUE_STATUSES.PENDING,
      priority: input.priority ?? "normal",
      retryCount: 0,
      maxRetries: 3,
      nextAttemptAt: input.scheduledAt ?? now,
      lastAttemptAt: null,
      errorMessage: null,
      createdAt: now,
    });

    this.record.analytics.totalSent += 1;

    return structuredClone(notification);
  }

  createTemplate(input: CreateTemplateInput): NotificationTemplate {
    const now = new Date().toISOString();
    const template: NotificationTemplate = {
      id: createId("tmpl"),
      tenantId: DEFAULT_NOTIFICATION_SCOPE.tenantId,
      name: input.name,
      slug: input.slug,
      subject: input.subject,
      bodyTemplate: input.bodyTemplate,
      channel: input.channel,
      eventSource: input.eventSource,
      eventKey: input.eventKey,
      variables: input.variables,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    this.record.templates.push(template);
    return structuredClone(template);
  }

  getTemplates(): NotificationTemplate[] {
    return structuredClone(this.record.templates);
  }
}

export const notificationRepository = new NotificationRepository();
