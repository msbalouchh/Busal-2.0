import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { NotificationTenantScope } from "@/modules/notifications/lib/notification-scope";
import {
  createCampaignRecord,
  defaultBranchNotificationMeta,
  fromPrismaChannel,
  mapNotificationAggregate,
  toPrismaCategory,
  toPrismaChannel,
  toPrismaPriority,
  type StoredNotificationBranchMeta,
} from "@/modules/notifications/lib/notification-mappers";
import type {
  Notification,
  NotificationRecord,
  NotificationSearchQuery,
  NotificationSearchResult,
  NotificationTemplate,
  SendNotificationInput,
  CreateTemplateInput,
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

const DEFAULT_PAGE_SIZE = 25;

function paginate<T>(items: T[], page: number, pageSize: number): NotificationSearchResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, page: safePage, pageSize, totalPages };
}

/** Prisma-backed notification repository with tenant scoping. */
export class NotificationRepository {
  private async loadBranchMeta(scope: NotificationTenantScope): Promise<StoredNotificationBranchMeta> {
    const settings = await prisma.branchSettings.findUnique({
      where: { branchId: scope.branchId },
      select: { settings: true },
    });
    const raw = settings?.settings;
    if (raw && typeof raw === "object" && raw !== null && "notificationOperations" in raw) {
      return (raw as unknown as { notificationOperations: StoredNotificationBranchMeta }).notificationOperations;
    }
    return defaultBranchNotificationMeta(scope);
  }

  private async saveBranchMeta(scope: NotificationTenantScope, meta: StoredNotificationBranchMeta): Promise<void> {
    const existing = await prisma.branchSettings.findUnique({
      where: { branchId: scope.branchId },
      select: { settings: true },
    });
    const settingsObject =
      existing?.settings && typeof existing.settings === "object" && existing.settings !== null
        ? (existing.settings as Record<string, unknown>)
        : {};

    await prisma.branchSettings.upsert({
      where: { branchId: scope.branchId },
      create: {
        branchId: scope.branchId,
        settings: { ...settingsObject, notificationOperations: meta } as unknown as Prisma.InputJsonValue,
      },
      update: {
        settings: { ...settingsObject, notificationOperations: meta } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private async ensureDefaultChannels(businessId: string): Promise<void> {
    const channels = ["IN_APP", "EMAIL", "SMS", "PUSH", "WHATSAPP", "WEBHOOK"] as const;
    await Promise.all(
      channels.map((channel) =>
        prisma.notificationChannelConfig.upsert({
          where: { businessId_channel: { businessId, channel } },
          create: {
            businessId,
            channel,
            name: channel.replace("_", " "),
            isEnabled: channel === "IN_APP" || channel === "EMAIL",
          },
          update: {},
        }),
      ),
    );
  }

  private async loadAggregate(scope: NotificationTenantScope): Promise<NotificationRecord> {
    await this.ensureDefaultChannels(scope.businessId);
    const branchFilter = { businessId: scope.businessId, branchId: scope.branchId };

    const [notifications, templates, channels, preferences, deliveries, rules, auditLogs, meta] =
      await Promise.all([
        prisma.notification.findMany({
          where: { businessId: scope.businessId, OR: [{ branchId: scope.branchId }, { branchId: null }] },
          include: { inboxItems: true, deliveries: true },
          orderBy: { createdAt: "desc" },
          take: 500,
        }),
        prisma.notificationTemplate.findMany({
          where: { OR: [{ businessId: scope.businessId }, { businessId: null }], isActive: true },
          orderBy: { updatedAt: "desc" },
        }),
        prisma.notificationChannelConfig.findMany({
          where: { OR: [{ businessId: scope.businessId }, { businessId: null }] },
        }),
        prisma.notificationUserPreference.findMany({
          where: { businessId: scope.businessId },
        }),
        prisma.notificationDelivery.findMany({
          where: branchFilter,
          orderBy: { createdAt: "desc" },
          take: 500,
        }),
        prisma.notificationDeliveryRule.findMany({
          where: { OR: [{ businessId: scope.businessId }, { businessId: null }] },
        }),
        prisma.notificationAuditLog.findMany({
          where: { businessId: scope.businessId },
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
        this.loadBranchMeta(scope),
      ]);

    return mapNotificationAggregate(
      scope,
      notifications,
      templates,
      channels,
      preferences,
      deliveries,
      rules,
      auditLogs,
      meta,
    );
  }

  async getRecord(scope: NotificationTenantScope): Promise<NotificationRecord> {
    return this.loadAggregate(scope);
  }

  async searchNotifications(
    scope: NotificationTenantScope,
    query: NotificationSearchQuery | NotificationSearchSchemaInput = {},
  ): Promise<NotificationSearchResult<Notification>> {
    const record = await this.getRecord(scope);
    let results = [...record.notifications];

    if (query.channel) results = results.filter((n) => n.channel === query.channel);
    if (query.status) results = results.filter((n) => n.status === query.status);
    if (query.eventSource) results = results.filter((n) => n.eventSource === query.eventSource);
    if (query.isRead !== undefined) results = results.filter((n) => n.isRead === query.isRead);
    if (query.query) {
      const term = query.query.toLowerCase();
      results = results.filter((n) => n.title.toLowerCase().includes(term) || n.body.toLowerCase().includes(term));
    }

    return paginate(results, query.page ?? 1, query.limit ?? query.pageSize ?? DEFAULT_PAGE_SIZE);
  }

  async findNotificationById(scope: NotificationTenantScope, notificationId: string): Promise<Notification | null> {
    const record = await this.getRecord(scope);
    return record.notifications.find((n) => n.id === notificationId) ?? null;
  }

  async getUnreadNotifications(scope: NotificationTenantScope): Promise<Notification[]> {
    const record = await this.getRecord(scope);
    return record.notifications.filter((n) => !n.isRead);
  }

  async getPendingQueue(scope: NotificationTenantScope): Promise<NotificationRecord["queue"]> {
    const record = await this.getRecord(scope);
    return record.queue.filter((q) => q.status === "pending" || q.status === "retry");
  }

  async getFailedDeliveries(scope: NotificationTenantScope): Promise<NotificationRecord["deliveries"]> {
    const record = await this.getRecord(scope);
    return record.deliveries.filter((d) => d.status === "failed" || d.status === "bounced");
  }

  async markAsRead(scope: NotificationTenantScope, notificationId: string): Promise<Notification | null> {
    const inboxItem = await prisma.notificationInboxItem.findFirst({
      where: { notificationId, userId: scope.userId, businessId: scope.businessId },
    });
    if (!inboxItem) return null;

    await prisma.notificationInboxItem.update({
      where: { id: inboxItem.id },
      data: { status: "READ", readAt: new Date() },
    });

    await prisma.notificationAuditLog.create({
      data: {
        businessId: scope.businessId,
        notificationId,
        eventType: "OPENED",
        triggeredByUserId: scope.userId,
        recipientUserId: scope.userId,
        channel: "IN_APP",
      },
    });

    return this.findNotificationById(scope, notificationId);
  }

  private async processDelivery(
    deliveryId: string,
    channel: ReturnType<typeof toPrismaChannel>,
  ): Promise<void> {
    const now = new Date();
    if (channel === "IN_APP") {
      await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: { status: "DELIVERED", sentAt: now, deliveredAt: now, deliveryTimeMs: 100 },
      });
      return;
    }

    await prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: { status: "SENT", sentAt: now, deliveryTimeMs: 250 },
    });
  }

  async sendNotification(
    scope: NotificationTenantScope,
    input: SendNotificationInput | SendNotificationSchemaInput,
  ): Promise<Notification> {
    const eventSource = "eventSource" in input && input.eventSource ? input.eventSource : "system";
    const prismaChannel = toPrismaChannel(input.channel);
    const isScheduled = Boolean(input.scheduledAt);

    const notification = await prisma.notification.create({
      data: {
        businessId: scope.businessId,
        branchId: scope.branchId,
        category: toPrismaCategory(eventSource),
        title: input.title,
        body: input.body,
        triggeredByUserId: scope.userId,
        triggeredByModule: eventSource,
        templateId: input.templateId ?? null,
        priority: toPrismaPriority(input.priority ?? "normal"),
      },
    });

    const delivery = await prisma.notificationDelivery.create({
      data: {
        notificationId: notification.id,
        businessId: scope.businessId,
        channel: prismaChannel,
        status: isScheduled ? "QUEUED" : "QUEUED",
        recipientUserId: input.recipientId,
        templateId: input.templateId ?? null,
        queuedAt: input.scheduledAt ? new Date(input.scheduledAt) : new Date(),
      },
    });

    if (input.channel === "in_app" || prismaChannel === "IN_APP") {
      await prisma.notificationInboxItem.create({
        data: {
          notificationId: notification.id,
          userId: input.recipientId,
          businessId: scope.businessId,
          status: "UNREAD",
        },
      });
    }

    if (!isScheduled) {
      await this.processDelivery(delivery.id, prismaChannel);
    }

    await prisma.notificationAuditLog.create({
      data: {
        businessId: scope.businessId,
        notificationId: notification.id,
        deliveryId: delivery.id,
        eventType: "PUBLISHED",
        triggeredByUserId: scope.userId,
        recipientUserId: input.recipientId,
        channel: prismaChannel,
      },
    });

    const result = await this.findNotificationById(scope, notification.id);
    if (!result) throw new Error("Failed to load created notification");
    return result;
  }

  async sendBulkNotifications(scope: NotificationTenantScope, input: BulkNotificationSchemaInput): Promise<number> {
    let count = 0;
    for (const recipientId of input.recipientIds) {
      for (const channel of input.channels) {
        await this.sendNotification(scope, {
          title: input.title,
          body: input.body,
          channel,
          recipientId,
          priority: input.priority,
        });
        count += 1;
      }
    }
    return count;
  }

  async retryDelivery(scope: NotificationTenantScope, input: RetryDeliverySchemaInput): Promise<boolean> {
    const delivery = await prisma.notificationDelivery.findFirst({
      where: { id: input.deliveryId, businessId: scope.businessId },
    });
    if (!delivery) return false;

    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "QUEUED",
        retryCount: delivery.retryCount + 1,
        errorMessage: null,
        queuedAt: new Date(),
      },
    });

    await this.processDelivery(delivery.id, delivery.channel);
    await prisma.notificationAuditLog.create({
      data: {
        businessId: scope.businessId,
        notificationId: delivery.notificationId,
        deliveryId: delivery.id,
        eventType: "RETRIED",
        triggeredByUserId: scope.userId,
        channel: delivery.channel,
      },
    });

    return true;
  }

  async handleWebhook(scope: NotificationTenantScope, input: WebhookPayloadSchemaInput): Promise<boolean> {
    const delivery = await prisma.notificationDelivery.findFirst({
      where: { id: input.deliveryId, businessId: scope.businessId },
    });
    if (!delivery) return false;

    const status = input.status === "delivered" ? "DELIVERED" : "FAILED";
    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: {
        status,
        deliveredAt: status === "DELIVERED" ? new Date() : null,
        failedAt: status === "FAILED" ? new Date() : null,
        errorMessage: input.errorMessage ?? null,
        metadata: input.messageId ? { messageId: input.messageId } : undefined,
      },
    });

    return true;
  }

  async createTemplate(
    scope: NotificationTenantScope,
    input: CreateTemplateInput | CreateTemplateSchemaInput,
  ): Promise<NotificationTemplate> {
    const template = await prisma.notificationTemplate.create({
      data: {
        businessId: scope.businessId,
        slug: input.slug,
        templateType:
          input.channel === "email"
            ? "EMAIL"
            : input.channel === "sms"
              ? "SMS"
              : input.channel === "push"
                ? "PUSH"
                : input.channel === "whatsapp"
                  ? "WHATSAPP"
                  : "IN_APP",
        category: toPrismaCategory(input.eventSource),
        name: input.name,
        subject: input.subject,
        body: input.bodyTemplate,
        variables: input.variables,
      },
    });

    await prisma.notificationAuditLog.create({
      data: {
        businessId: scope.businessId,
        eventType: "TEMPLATE_CREATED",
        triggeredByUserId: scope.userId,
        templateId: template.id,
      },
    });

    const record = await this.getRecord(scope);
    return record.templates.find((t) => t.id === template.id)!;
  }

  async getTemplates(scope: NotificationTenantScope): Promise<NotificationTemplate[]> {
    const record = await this.getRecord(scope);
    return record.templates;
  }

  async createRule(scope: NotificationTenantScope, input: CreateRuleSchemaInput) {
    const rule = await prisma.notificationDeliveryRule.create({
      data: {
        businessId: scope.businessId,
        name: input.name,
        mode: "IMMEDIATE",
        priority: "NORMAL",
        category: toPrismaCategory(input.eventSource),
        channel: input.channels[0] ? toPrismaChannel(input.channels[0]) : "IN_APP",
        isActive: input.isActive,
      },
    });

    await prisma.notificationAuditLog.create({
      data: { businessId: scope.businessId, eventType: "RULE_CREATED", triggeredByUserId: scope.userId },
    });

    const record = await this.getRecord(scope);
    return record.rules.find((r) => r.id === rule.id)!;
  }

  async updatePreference(scope: NotificationTenantScope, input: UpdatePreferenceSchemaInput) {
    const pref = await prisma.notificationUserPreference.upsert({
      where: { userId_businessId: { userId: scope.userId, businessId: scope.businessId } },
      create: {
        userId: scope.userId,
        businessId: scope.businessId,
        enabledChannels: input.isEnabled ? [toPrismaChannel(input.channel)] : [],
        quietHoursStart: input.quietHoursStart ?? null,
        quietHoursEnd: input.quietHoursEnd ?? null,
      },
      update: {
        enabledChannels: input.isEnabled ? [toPrismaChannel(input.channel)] : [],
        quietHoursStart: input.quietHoursStart ?? null,
        quietHoursEnd: input.quietHoursEnd ?? null,
      },
    });

    await prisma.notificationAuditLog.create({
      data: {
        businessId: scope.businessId,
        eventType: "PREFERENCE_UPDATED",
        triggeredByUserId: scope.userId,
      },
    });

    const record = await this.getRecord(scope);
    return record.preferences.find((p) => p.id === pref.id)!;
  }

  async createCampaign(scope: NotificationTenantScope, input: CreateCampaignSchemaInput) {
    const meta = await this.loadBranchMeta(scope);
    const campaign = createCampaignRecord(scope, input);
    meta.campaigns.push(campaign);
    await this.saveBranchMeta(scope, meta);
    return campaign;
  }

  async deleteTemplate(scope: NotificationTenantScope, templateId: string): Promise<boolean> {
    const template = await prisma.notificationTemplate.findFirst({
      where: { id: templateId, businessId: scope.businessId },
    });
    if (!template) return false;
    await prisma.notificationTemplate.update({
      where: { id: templateId },
      data: { isActive: false },
    });
    return true;
  }
}

export const notificationRepository = new NotificationRepository();
