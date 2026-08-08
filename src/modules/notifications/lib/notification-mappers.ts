import "server-only";

import type {
  Notification as PrismaNotification,
  NotificationAuditLog,
  NotificationChannelConfig,
  NotificationDelivery,
  NotificationDeliveryRule,
  NotificationInboxItem,
  NotificationTemplate,
  NotificationUserPreference,
  NotificationAuditEventType,
  NotificationCategory,
  NotificationChannel as PrismaChannel,
  NotificationDeliveryStatus,
  NotificationInboxStatus,
  NotificationPriority as PrismaPriority,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";

import {
  DELIVERY_STATUSES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_SOURCES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_SCOPES,
  NOTIFICATION_STATUSES,
  QUEUE_STATUSES,
  type NotificationChannel,
  type NotificationEventSource,
  type NotificationPriority,
  type NotificationStatus,
} from "@/modules/notifications/constants/notification-status";
import type { NotificationTenantScope } from "@/modules/notifications/lib/notification-scope";
import type {
  Notification,
  NotificationAiContext,
  NotificationAnalytics,
  NotificationCampaign,
  NotificationChannelConfig as PlatformChannelConfig,
  NotificationDelivery as PlatformDelivery,
  NotificationHistory,
  NotificationPreference,
  NotificationQueue,
  NotificationRecord,
  NotificationRule,
  NotificationTemplate as PlatformTemplate,
} from "@/modules/notifications/types/notification-platform";

export interface StoredNotificationBranchMeta {
  campaigns: NotificationCampaign[];
  events: NotificationRecord["events"];
  schedules: NotificationRecord["schedules"];
  recipients: NotificationRecord["recipients"];
}

const CHANNEL_TO_PRISMA: Record<NotificationChannel, PrismaChannel> = {
  email: "EMAIL",
  sms: "SMS",
  whatsapp: "WHATSAPP",
  push: "PUSH",
  in_app: "IN_APP",
  slack: "SLACK",
  webhook: "WEBHOOK",
  custom: "WEBHOOK",
};

const PRISMA_TO_CHANNEL: Record<PrismaChannel, NotificationChannel> = {
  IN_APP: NOTIFICATION_CHANNELS.IN_APP,
  EMAIL: NOTIFICATION_CHANNELS.EMAIL,
  SMS: NOTIFICATION_CHANNELS.SMS,
  PUSH: NOTIFICATION_CHANNELS.PUSH,
  WHATSAPP: NOTIFICATION_CHANNELS.WHATSAPP,
  WEBHOOK: NOTIFICATION_CHANNELS.WEBHOOK,
  SLACK: NOTIFICATION_CHANNELS.SLACK,
  TEAMS: NOTIFICATION_CHANNELS.WEBHOOK,
  DISCORD: NOTIFICATION_CHANNELS.WEBHOOK,
};

const PRIORITY_TO_PRISMA: Record<NotificationPriority, PrismaPriority> = {
  low: "LOW",
  normal: "NORMAL",
  high: "HIGH",
  urgent: "URGENT",
};

const PRISMA_TO_PRIORITY: Record<PrismaPriority, NotificationPriority> = {
  LOW: NOTIFICATION_PRIORITIES.LOW,
  NORMAL: NOTIFICATION_PRIORITIES.NORMAL,
  HIGH: NOTIFICATION_PRIORITIES.HIGH,
  URGENT: NOTIFICATION_PRIORITIES.URGENT,
};

const EVENT_TO_CATEGORY: Record<NotificationEventSource, NotificationCategory> = {
  auth: "SECURITY",
  crm: "CRM",
  orders: "ORDERS",
  reservations: "RESERVATIONS",
  kitchen: "ORDERS",
  pos: "ORDERS",
  inventory: "INVENTORY",
  staff: "SYSTEM",
  finance: "REVENUE",
  billing: "COMMERCIAL",
  analytics: "AI",
  system: "SYSTEM",
};

const CATEGORY_TO_EVENT: Partial<Record<NotificationCategory, NotificationEventSource>> = {
  CRM: NOTIFICATION_EVENT_SOURCES.CRM,
  ORDERS: NOTIFICATION_EVENT_SOURCES.ORDERS,
  RESERVATIONS: NOTIFICATION_EVENT_SOURCES.RESERVATIONS,
  INVENTORY: NOTIFICATION_EVENT_SOURCES.INVENTORY,
  COMMERCIAL: NOTIFICATION_EVENT_SOURCES.BILLING,
  AI: NOTIFICATION_EVENT_SOURCES.ANALYTICS,
  SYSTEM: NOTIFICATION_EVENT_SOURCES.SYSTEM,
  SECURITY: NOTIFICATION_EVENT_SOURCES.AUTH,
  REVENUE: NOTIFICATION_EVENT_SOURCES.FINANCE,
};

export function toPrismaChannel(channel: NotificationChannel): PrismaChannel {
  return CHANNEL_TO_PRISMA[channel];
}

export function fromPrismaChannel(channel: PrismaChannel): NotificationChannel {
  return PRISMA_TO_CHANNEL[channel];
}

export function toPrismaPriority(priority: NotificationPriority): PrismaPriority {
  return PRIORITY_TO_PRISMA[priority];
}

export function fromPrismaPriority(priority: PrismaPriority): NotificationPriority {
  return PRISMA_TO_PRIORITY[priority];
}

export function toPrismaCategory(eventSource: NotificationEventSource): NotificationCategory {
  return EVENT_TO_CATEGORY[eventSource];
}

export function fromPrismaCategory(category: NotificationCategory): NotificationEventSource {
  return CATEGORY_TO_EVENT[category] ?? NOTIFICATION_EVENT_SOURCES.SYSTEM;
}

function deliveryStatusToPlatform(status: NotificationDeliveryStatus): PlatformDelivery["status"] {
  switch (status) {
    case "QUEUED":
      return DELIVERY_STATUSES.PENDING;
    case "SENT":
      return DELIVERY_STATUSES.IN_PROGRESS;
    case "DELIVERED":
    case "OPENED":
    case "CLICKED":
      return DELIVERY_STATUSES.DELIVERED;
    case "FAILED":
      return DELIVERY_STATUSES.FAILED;
    default:
      return DELIVERY_STATUSES.PENDING;
  }
}

function deriveNotificationStatus(
  delivery: NotificationDelivery | undefined,
  inbox: NotificationInboxItem | undefined,
): NotificationStatus {
  if (inbox?.status === "READ") {
    return NOTIFICATION_STATUSES.READ;
  }
  if (!delivery) {
    return NOTIFICATION_STATUSES.QUEUED;
  }
  switch (delivery.status) {
    case "QUEUED":
      return NOTIFICATION_STATUSES.QUEUED;
    case "SENT":
      return NOTIFICATION_STATUSES.SENT;
    case "DELIVERED":
    case "OPENED":
    case "CLICKED":
      return NOTIFICATION_STATUSES.DELIVERED;
    case "FAILED":
      return NOTIFICATION_STATUSES.FAILED;
    default:
      return NOTIFICATION_STATUSES.QUEUED;
  }
}

function mapTemplate(template: NotificationTemplate, scope: NotificationTenantScope): PlatformTemplate {
  const variables = Array.isArray(template.variables)
    ? (template.variables as string[])
    : [];

  return {
    id: template.id,
    tenantId: scope.tenantId,
    name: template.name,
    slug: template.slug,
    subject: template.subject ?? "",
    bodyTemplate: template.body,
    channel: fromPrismaChannel(
      template.templateType === "EMAIL"
        ? "EMAIL"
        : template.templateType === "SMS"
          ? "SMS"
          : template.templateType === "PUSH"
            ? "PUSH"
            : template.templateType === "WHATSAPP"
              ? "WHATSAPP"
              : "IN_APP",
    ),
    eventSource: fromPrismaCategory(template.category),
    eventKey: `${template.category.toLowerCase()}.${template.slug}`,
    variables,
    isActive: template.isActive,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

function mapChannel(config: NotificationChannelConfig, scope: NotificationTenantScope): PlatformChannelConfig {
  const rawConfig = config.config && typeof config.config === "object" ? (config.config as Record<string, string>) : {};
  return {
    id: config.id,
    tenantId: scope.tenantId,
    channel: fromPrismaChannel(config.channel),
    label: config.name,
    isEnabled: config.isEnabled,
    providerName: rawConfig.provider ?? null,
    config: rawConfig,
    rateLimitPerHour: Number(rawConfig.rateLimitPerHour ?? 1000),
    createdAt: config.createdAt.toISOString(),
  };
}

function mapPreference(pref: NotificationUserPreference, scope: NotificationTenantScope): NotificationPreference {
  return {
    id: pref.id,
    tenantId: scope.tenantId,
    userId: pref.userId,
    channel: fromPrismaChannel(pref.enabledChannels[0] ?? "IN_APP"),
    eventSource: NOTIFICATION_EVENT_SOURCES.SYSTEM,
    eventKey: "system.all",
    isEnabled: pref.enabledChannels.length > 0,
    quietHoursStart: pref.quietHoursStart,
    quietHoursEnd: pref.quietHoursEnd,
    updatedAt: pref.updatedAt.toISOString(),
  };
}

function mapDelivery(delivery: NotificationDelivery, scope: NotificationTenantScope): PlatformDelivery {
  return {
    id: delivery.id,
    tenantId: scope.tenantId,
    notificationId: delivery.notificationId,
    queueId: delivery.id,
    channel: fromPrismaChannel(delivery.channel),
    status: deliveryStatusToPlatform(delivery.status),
    attemptNumber: delivery.retryCount + 1,
    providerMessageId: delivery.metadata && typeof delivery.metadata === "object" ? String((delivery.metadata as Record<string, unknown>).messageId ?? "") : null,
    deliveredAt: delivery.deliveredAt?.toISOString() ?? null,
    failureReason: delivery.errorMessage,
    createdAt: delivery.createdAt.toISOString(),
  };
}

function mapQueueItem(delivery: NotificationDelivery, scope: NotificationTenantScope): NotificationQueue {
  const status =
    delivery.status === "FAILED"
      ? delivery.retryCount > 0
        ? QUEUE_STATUSES.RETRY
        : QUEUE_STATUSES.FAILED
      : delivery.status === "QUEUED"
        ? QUEUE_STATUSES.PENDING
        : QUEUE_STATUSES.COMPLETED;

  return {
    id: delivery.id,
    tenantId: scope.tenantId,
    notificationId: delivery.notificationId,
    channel: fromPrismaChannel(delivery.channel),
    status,
    priority: NOTIFICATION_PRIORITIES.NORMAL,
    retryCount: delivery.retryCount,
    maxRetries: 3,
    nextAttemptAt: delivery.queuedAt.toISOString(),
    lastAttemptAt: delivery.sentAt?.toISOString() ?? null,
    errorMessage: delivery.errorMessage,
    createdAt: delivery.createdAt.toISOString(),
  };
}

function mapRule(rule: NotificationDeliveryRule, scope: NotificationTenantScope): NotificationRule {
  return {
    id: rule.id,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    name: rule.name,
    eventSource: rule.category ? fromPrismaCategory(rule.category) : NOTIFICATION_EVENT_SOURCES.SYSTEM,
    eventKey: `${rule.category?.toLowerCase() ?? "system"}.rule`,
    templateId: "",
    channels: rule.channel ? [fromPrismaChannel(rule.channel)] : [NOTIFICATION_CHANNELS.IN_APP],
    scope: NOTIFICATION_SCOPES.BUSINESS,
    targetRoleIds: [],
    isActive: rule.isActive,
    conditions: {},
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}

function mapHistory(log: NotificationAuditLog, scope: NotificationTenantScope): NotificationHistory {
  const actionMap: Record<NotificationAuditEventType, NotificationHistory["action"]> = {
    PUBLISHED: "created",
    QUEUED: "queued",
    SENT: "sent",
    DELIVERED: "delivered",
    OPENED: "read",
    CLICKED: "read",
    FAILED: "failed",
    RETRIED: "retried",
    TEMPLATE_CREATED: "created",
    RULE_CREATED: "created",
    PREFERENCE_UPDATED: "created",
  };

  return {
    id: log.id,
    tenantId: scope.tenantId,
    notificationId: log.notificationId ?? "",
    action: actionMap[log.eventType] ?? "created",
    channel: log.channel ? fromPrismaChannel(log.channel) : NOTIFICATION_CHANNELS.IN_APP,
    actorUserId: log.triggeredByUserId,
    details: log.eventType,
    occurredAt: log.createdAt.toISOString(),
  };
}

export function mapNotificationAggregate(
  scope: NotificationTenantScope,
  notifications: Array<PrismaNotification & { inboxItems: NotificationInboxItem[]; deliveries: NotificationDelivery[] }>,
  templates: NotificationTemplate[],
  channels: NotificationChannelConfig[],
  preferences: NotificationUserPreference[],
  deliveries: NotificationDelivery[],
  rules: NotificationDeliveryRule[],
  auditLogs: NotificationAuditLog[],
  meta: StoredNotificationBranchMeta,
): NotificationRecord {
  const mappedNotifications: Notification[] = notifications.map((notification) => {
    const inbox = notification.inboxItems.find((item) => item.userId === scope.userId);
    const delivery = notification.deliveries[0];
    const metadata =
      notification.payload && typeof notification.payload === "object"
        ? Object.fromEntries(
            Object.entries(notification.payload as Record<string, unknown>).map(([key, value]) => [
              key,
              String(value),
            ]),
          )
        : {};

    return {
      id: notification.id,
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      businessId: notification.businessId,
      branchId: notification.branchId,
      templateId: notification.templateId,
      title: notification.title,
      body: notification.body,
      channel: delivery ? fromPrismaChannel(delivery.channel) : NOTIFICATION_CHANNELS.IN_APP,
      status: deriveNotificationStatus(delivery, inbox),
      priority: fromPrismaPriority(notification.priority),
      scope: notification.branchId ? NOTIFICATION_SCOPES.BRANCH : NOTIFICATION_SCOPES.BUSINESS,
      eventSource: fromPrismaCategory(notification.category),
      eventKey: `${notification.triggeredByModule}.${notification.category.toLowerCase()}`,
      recipientId: inbox?.userId ?? scope.userId,
      isRead: inbox?.status === "READ",
      readAt: inbox?.readAt?.toISOString() ?? null,
      scheduledAt: null,
      sentAt: delivery?.sentAt?.toISOString() ?? null,
      metadata,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.createdAt.toISOString(),
    };
  });

  const platformDeliveries = deliveries.map((delivery) => mapDelivery(delivery, scope));
  const totalSent = platformDeliveries.filter((d) => d.status !== DELIVERY_STATUSES.PENDING).length;
  const totalDelivered = platformDeliveries.filter((d) => d.status === DELIVERY_STATUSES.DELIVERED).length;
  const totalFailed = platformDeliveries.filter((d) => d.status === DELIVERY_STATUSES.FAILED).length;
  const totalRead = mappedNotifications.filter((n) => n.isRead).length;
  const deliveryRateBps = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 10000) : 0;
  const readRateBps = totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 10000) : 0;

  const channelBreakdown = Object.values(NOTIFICATION_CHANNELS).map((channel) => {
    const channelDeliveries = platformDeliveries.filter((d) => d.channel === channel);
    const delivered = channelDeliveries.filter((d) => d.status === DELIVERY_STATUSES.DELIVERED).length;
    return {
      channel,
      count: channelDeliveries.length,
      deliveryRateBps: channelDeliveries.length > 0 ? Math.round((delivered / channelDeliveries.length) * 10000) : 0,
    };
  });

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const analytics: NotificationAnalytics = {
    tenantId: scope.tenantId,
    totalSent,
    totalDelivered,
    totalFailed,
    totalRead,
    deliveryRateBps,
    readRateBps,
    averageDeliveryTimeMs:
      deliveries.filter((d) => d.deliveryTimeMs).reduce((sum, d) => sum + (d.deliveryTimeMs ?? 0), 0) /
        Math.max(1, deliveries.filter((d) => d.deliveryTimeMs).length),
    channelBreakdown,
    periodStart,
    periodEnd,
  };

  const aiContext: NotificationAiContext = {
    tenantId: scope.tenantId,
    summary: `${mappedNotifications.length} notifications — ${totalRead} read — ${totalFailed} failed`,
    unreadCount: mappedNotifications.filter((n) => !n.isRead).length,
    failedDeliveryCount: totalFailed,
    recommendedChannel:
      [...channelBreakdown].sort((a, b) => b.deliveryRateBps - a.deliveryRateBps)[0]?.channel ?? null,
    optimalSendTime: "09:00",
    insights: totalFailed > 0 ? ["Review failed delivery channels"] : ["Delivery performance is stable"],
    recommendedActions: totalFailed > 0 ? ["Retry failed notifications"] : ["Maintain current channel mix"],
    lastGeneratedAt: new Date().toISOString(),
  };

  return {
    notifications: mappedNotifications,
    templates: templates.map((template) => mapTemplate(template, scope)),
    channels: channels.map((channel) => mapChannel(channel, scope)),
    preferences: preferences.map((pref) => mapPreference(pref, scope)),
    queue: deliveries.filter((d) => d.status === "QUEUED" || d.status === "FAILED").map((d) => mapQueueItem(d, scope)),
    deliveries: platformDeliveries,
    history: auditLogs.map((log) => mapHistory(log, scope)),
    rules: rules.map((rule) => mapRule(rule, scope)),
    events: meta.events,
    schedules: meta.schedules,
    recipients: meta.recipients,
    campaigns: meta.campaigns.filter((campaign) => campaign.deletedAt === null),
    analytics,
    aiContext,
  };
}

export function defaultBranchNotificationMeta(scope: NotificationTenantScope): StoredNotificationBranchMeta {
  return { campaigns: [], events: [], schedules: [], recipients: [] };
}

export function createCampaignRecord(
  scope: NotificationTenantScope,
  input: {
    name: string;
    description: string;
    templateId?: string | null;
    channels: NotificationChannel[];
    recipientIds: string[];
    scheduledAt?: string | null;
  },
): NotificationCampaign {
  const now = new Date().toISOString();
  return {
    id: `campaign-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    name: input.name,
    description: input.description,
    templateId: input.templateId ?? null,
    channels: input.channels,
    recipientIds: input.recipientIds,
    status: input.scheduledAt ? "scheduled" : "draft",
    scheduledAt: input.scheduledAt ?? null,
    sentCount: 0,
    failedCount: 0,
    createdByUserId: scope.userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

export type { Prisma };
