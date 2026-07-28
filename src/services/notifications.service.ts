import "server-only";

import type {
  NotificationAuditEventType,
  NotificationCategory,
  NotificationChannel,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  evaluatePermission,
  toPermissionEvaluationContext,
} from "@/modules/iam/engine/permission-engine";
import {
  DEFAULT_DELIVERY_RULE,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "@/modules/notifications/constants/routes";
import {
  planNotificationDelivery,
  simulateChannelDelivery,
} from "@/modules/notifications/engine/notification-engine";
import { renderTemplate } from "@/modules/notifications/engine/template-engine";
import { shouldRetryDelivery } from "@/modules/notifications/engine/rule-engine";
import {
  DEFAULT_NOTIFICATION_TEMPLATES,
  ensureBootstrapNotifications,
} from "@/modules/notifications/plugins/bootstrap-notifications";
import type {
  BulkInboxActionInput,
  CreateDeliveryRuleInput,
  CreateTemplateInput,
  InboxFilterInput,
  NotificationDashboardMetrics,
  PublishNotificationInput,
  PublishNotificationResult,
  UpdateUserPreferencesInput,
  UserPreferenceContext,
} from "@/modules/notifications/types/notification-types";

function assertPermission(platform: BusinessContext, permission: string): void {
  const context = toPermissionEvaluationContext({
    permissions: platform.permissions,
    roleSlug: platform.roleSlug,
    isOwner: platform.isOwner,
    businessId: platform.business.id,
    branchId: platform.branchId,
  });

  if (!evaluatePermission(context, permission)) {
    throw new Error(`Permission denied: ${permission} required`);
  }
}

async function logAuditEvent(input: {
  businessId?: string | null;
  notificationId?: string | null;
  deliveryId?: string | null;
  eventType: NotificationAuditEventType;
  triggeredByUserId?: string | null;
  recipientUserId?: string | null;
  channel?: NotificationChannel | null;
  templateId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.notificationAuditLog.create({
    data: {
      businessId: input.businessId ?? null,
      notificationId: input.notificationId ?? null,
      deliveryId: input.deliveryId ?? null,
      eventType: input.eventType,
      triggeredByUserId: input.triggeredByUserId ?? null,
      recipientUserId: input.recipientUserId ?? null,
      channel: input.channel ?? null,
      templateId: input.templateId ?? null,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

export async function ensureNotificationDefaults(businessId: string): Promise<void> {
  ensureBootstrapNotifications();

  for (const template of DEFAULT_NOTIFICATION_TEMPLATES) {
    const existing = await prisma.notificationTemplate.findFirst({
      where: { businessId, slug: template.slug, locale: "en", version: 1 },
    });

    if (existing) {
      continue;
    }

    await prisma.notificationTemplate.create({
      data: {
        businessId,
        slug: template.slug,
        templateType: template.templateType,
        category: template.category,
        name: template.name,
        subject: template.subject,
        body: template.body,
        variables: template.variables as Prisma.InputJsonValue,
        locale: "en",
        version: 1,
      },
    });
  }

  const ruleExists = await prisma.notificationDeliveryRule.findFirst({
    where: { businessId, name: "Default Immediate Delivery" },
  });

  if (!ruleExists) {
    await prisma.notificationDeliveryRule.create({
      data: {
        businessId,
        name: "Default Immediate Delivery",
        mode: DEFAULT_DELIVERY_RULE.mode,
        priority: DEFAULT_DELIVERY_RULE.priority,
        silent: DEFAULT_DELIVERY_RULE.silent,
        businessHoursOnly: DEFAULT_DELIVERY_RULE.businessHoursOnly,
        retryCount: DEFAULT_DELIVERY_RULE.retryCount,
        retryDelayMinutes: DEFAULT_DELIVERY_RULE.retryDelayMinutes,
        digestFrequency: DEFAULT_DELIVERY_RULE.digestFrequency,
      },
    });
  }

  const channels: NotificationChannel[] = [
    "IN_APP",
    "EMAIL",
    "SMS",
    "PUSH",
    "WHATSAPP",
    "WEBHOOK",
    "SLACK",
    "TEAMS",
    "DISCORD",
  ];

  for (const channel of channels) {
    const existing = await prisma.notificationChannelConfig.findFirst({
      where: { businessId, channel },
    });

    if (existing) {
      continue;
    }

    await prisma.notificationChannelConfig.create({
      data: {
        businessId,
        channel,
        name: channel.replace(/_/g, " "),
        isEnabled: channel === "IN_APP" || channel === "EMAIL",
        config: { integrated: channel === "IN_APP" || channel === "EMAIL" },
      },
    });
  }
}

export async function publishNotificationEvent(
  input: PublishNotificationInput,
): Promise<PublishNotificationResult> {
  ensureBootstrapNotifications();

  const rules = await prisma.notificationDeliveryRule.findMany({
    where: { businessId: input.businessId, isActive: true },
  });

  let template: { id: string; subject: string | null; body: string } | null = null;
  if (input.templateSlug) {
    const found = await prisma.notificationTemplate.findFirst({
      where: {
        businessId: input.businessId,
        slug: input.templateSlug,
        isActive: true,
        locale: "en",
      },
      orderBy: { version: "desc" },
    });

    if (found) {
      template = { id: found.id, subject: found.subject, body: found.body };
    }
  }

  const recipientUserIds =
    input.recipientUserIds ?? (input.triggeredByUserId ? [input.triggeredByUserId] : []);

  const preferences: UserPreferenceContext[] = [];
  for (const userId of recipientUserIds) {
    preferences.push(await getOrCreateUserPreferences(input.businessId, userId));
  }

  const plan = planNotificationDelivery({
    publishInput: input,
    rules,
    preferences,
    template,
  });

  const notification = await prisma.notification.create({
    data: {
      businessId: input.businessId,
      branchId: input.branchId ?? null,
      category: input.category,
      title: plan.renderedTitle,
      body: plan.renderedBody,
      payload: input.payload ? (input.payload as Prisma.InputJsonValue) : undefined,
      triggeredByUserId: input.triggeredByUserId ?? null,
      triggeredByModule: input.triggeredByModule,
      templateId: template?.id ?? null,
      priority: plan.priority,
    },
  });

  await logAuditEvent({
    businessId: input.businessId,
    notificationId: notification.id,
    eventType: "PUBLISHED",
    triggeredByUserId: input.triggeredByUserId ?? null,
    templateId: template?.id ?? null,
    metadata: { module: input.triggeredByModule, category: input.category },
  });

  const deliveryIds: string[] = [];

  if (recipientUserIds.length === 0) {
    for (const channel of plan.channels) {
      const delivery = await createAndProcessDelivery({
        notificationId: notification.id,
        businessId: input.businessId,
        channel,
        recipientUserId: null,
        recipientEmail: input.recipientEmail ?? null,
        recipientPhone: input.recipientPhone ?? null,
        templateId: template?.id ?? null,
        deliveryRuleId: plan.applicableRuleIds[0] ?? null,
        renderedSubject: plan.renderedSubject,
        renderedBody: plan.renderedBody,
        silent: plan.silent,
        mode: plan.mode,
      });
      deliveryIds.push(delivery.id);
    }
  } else {
    for (const userId of recipientUserIds) {
      for (const channel of plan.channels) {
        const delivery = await createAndProcessDelivery({
          notificationId: notification.id,
          businessId: input.businessId,
          channel,
          recipientUserId: userId,
          recipientEmail: input.recipientEmail ?? null,
          recipientPhone: input.recipientPhone ?? null,
          templateId: template?.id ?? null,
          deliveryRuleId: plan.applicableRuleIds[0] ?? null,
          renderedSubject: plan.renderedSubject,
          renderedBody: plan.renderedBody,
          silent: plan.silent,
          mode: plan.mode,
        });
        deliveryIds.push(delivery.id);

        if (channel === "IN_APP") {
          await prisma.notificationInboxItem.upsert({
            where: {
              notificationId_userId: {
                notificationId: notification.id,
                userId,
              },
            },
            create: {
              notificationId: notification.id,
              userId,
              businessId: input.businessId,
              status: plan.silent ? "READ" : "UNREAD",
            },
            update: {},
          });
        }
      }
    }
  }

  return { notificationId: notification.id, deliveryIds };
}

async function createAndProcessDelivery(input: {
  notificationId: string;
  businessId: string;
  channel: NotificationChannel;
  recipientUserId: string | null;
  recipientEmail: string | null;
  recipientPhone: string | null;
  templateId: string | null;
  deliveryRuleId: string | null;
  renderedSubject: string | null;
  renderedBody: string;
  silent: boolean;
  mode: string;
}): Promise<{ id: string }> {
  const delivery = await prisma.notificationDelivery.create({
    data: {
      notificationId: input.notificationId,
      businessId: input.businessId,
      channel: input.channel,
      status: "QUEUED",
      recipientUserId: input.recipientUserId,
      recipientEmail: input.recipientEmail,
      recipientPhone: input.recipientPhone,
      templateId: input.templateId,
      deliveryRuleId: input.deliveryRuleId,
      renderedSubject: input.renderedSubject,
      renderedBody: input.renderedBody,
      metadata: { silent: input.silent, mode: input.mode },
    },
  });

  await logAuditEvent({
    businessId: input.businessId,
    notificationId: input.notificationId,
    deliveryId: delivery.id,
    eventType: "QUEUED",
    recipientUserId: input.recipientUserId,
    channel: input.channel,
    templateId: input.templateId,
  });

  if (input.mode === "IMMEDIATE" || input.mode === "RETRY") {
    await processDelivery(delivery.id);
  }

  return { id: delivery.id };
}

export async function processDelivery(deliveryId: string): Promise<void> {
  const delivery = await prisma.notificationDelivery.findUnique({
    where: { id: deliveryId },
  });

  if (!delivery || delivery.status === "DELIVERED" || delivery.status === "CLICKED") {
    return;
  }

  const simulation = simulateChannelDelivery(delivery.channel);
  const now = new Date();

  if (simulation.status === "FAILED") {
    const rule = delivery.deliveryRuleId
      ? await prisma.notificationDeliveryRule.findUnique({ where: { id: delivery.deliveryRuleId } })
      : null;

    const maxRetries = rule?.retryCount ?? DEFAULT_DELIVERY_RULE.retryCount;

    if (shouldRetryDelivery(delivery.retryCount, maxRetries)) {
      await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          retryCount: delivery.retryCount + 1,
          status: "QUEUED",
        },
      });

      await logAuditEvent({
        businessId: delivery.businessId,
        notificationId: delivery.notificationId,
        deliveryId: delivery.id,
        eventType: "RETRIED",
        recipientUserId: delivery.recipientUserId,
        channel: delivery.channel,
      });

      return;
    }

    await prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "FAILED",
        failedAt: now,
        errorMessage: simulation.errorMessage,
      },
    });

    await logAuditEvent({
      businessId: delivery.businessId,
      notificationId: delivery.notificationId,
      deliveryId: delivery.id,
      eventType: "FAILED",
      recipientUserId: delivery.recipientUserId,
      channel: delivery.channel,
    });

    return;
  }

  await prisma.notificationDelivery.update({
    where: { id: deliveryId },
    data: {
      status: simulation.status,
      sentAt: simulation.sentAt,
      deliveredAt: simulation.deliveredAt,
      deliveryTimeMs: simulation.deliveryTimeMs,
    },
  });

  await logAuditEvent({
    businessId: delivery.businessId,
    notificationId: delivery.notificationId,
    deliveryId: delivery.id,
    eventType: simulation.status === "QUEUED" ? "QUEUED" : "DELIVERED",
    recipientUserId: delivery.recipientUserId,
    channel: delivery.channel,
  });
}

export async function createNotificationTemplate(
  platform: BusinessContext,
  input: CreateTemplateInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.NOTIFICATIONS_MANAGE_TEMPLATES);

  const latest = await prisma.notificationTemplate.findFirst({
    where: {
      businessId: platform.business.id,
      slug: input.slug,
      locale: input.locale ?? "en",
    },
    orderBy: { version: "desc" },
  });

  const version = (latest?.version ?? 0) + 1;

  const template = await prisma.notificationTemplate.create({
    data: {
      businessId: platform.business.id,
      slug: input.slug,
      templateType: input.templateType,
      category: input.category,
      name: input.name,
      subject: input.subject ?? null,
      body: input.body,
      variables: (input.variables ?? []) as unknown as Prisma.InputJsonValue,
      locale: input.locale ?? "en",
      version,
    },
  });

  await logAuditEvent({
    businessId: platform.business.id,
    eventType: "TEMPLATE_CREATED",
    triggeredByUserId: platform.user.id,
    templateId: template.id,
    metadata: { slug: input.slug, version },
  });

  return { id: template.id };
}

export async function createNotificationDeliveryRule(
  platform: BusinessContext,
  input: CreateDeliveryRuleInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.NOTIFICATIONS_MANAGE_RULES);

  const rule = await prisma.notificationDeliveryRule.create({
    data: {
      businessId: platform.business.id,
      name: input.name,
      mode: input.mode,
      priority: input.priority ?? "NORMAL",
      category: input.category ?? null,
      channel: input.channel ?? null,
      silent: input.silent ?? false,
      businessHoursOnly: input.businessHoursOnly ?? false,
      retryCount: input.retryCount ?? 0,
      retryDelayMinutes: input.retryDelayMinutes ?? 5,
      digestFrequency: input.digestFrequency ?? "NONE",
    },
  });

  await logAuditEvent({
    businessId: platform.business.id,
    eventType: "RULE_CREATED",
    triggeredByUserId: platform.user.id,
    metadata: { ruleId: rule.id, name: input.name },
  });

  return { id: rule.id };
}

export async function getOrCreateUserPreferences(
  businessId: string,
  userId: string,
): Promise<UserPreferenceContext> {
  const existing = await prisma.notificationUserPreference.findUnique({
    where: { userId_businessId: { userId, businessId } },
  });

  if (existing) {
    return mapPreferenceContext(existing);
  }

  const created = await prisma.notificationUserPreference.create({
    data: {
      userId,
      businessId,
      enabledChannels: [...DEFAULT_NOTIFICATION_PREFERENCES.enabledChannels],
      language: DEFAULT_NOTIFICATION_PREFERENCES.language,
      digestFrequency: DEFAULT_NOTIFICATION_PREFERENCES.digestFrequency,
    },
  });

  return mapPreferenceContext(created);
}

export async function updateNotificationUserPreferences(
  platform: BusinessContext,
  input: UpdateUserPreferencesInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.NOTIFICATIONS_MANAGE_PREFERENCES);

  await getOrCreateUserPreferences(platform.business.id, platform.user.id);

  const updated = await prisma.notificationUserPreference.update({
    where: {
      userId_businessId: {
        userId: platform.user.id,
        businessId: platform.business.id,
      },
    },
    data: {
      ...(input.enabledChannels !== undefined ? { enabledChannels: input.enabledChannels } : {}),
      ...(input.quietHoursStart !== undefined ? { quietHoursStart: input.quietHoursStart } : {}),
      ...(input.quietHoursEnd !== undefined ? { quietHoursEnd: input.quietHoursEnd } : {}),
      ...(input.language !== undefined ? { language: input.language } : {}),
      ...(input.disabledCategories !== undefined
        ? { disabledCategories: input.disabledCategories }
        : {}),
      ...(input.digestFrequency !== undefined ? { digestFrequency: input.digestFrequency } : {}),
    },
  });

  await logAuditEvent({
    businessId: platform.business.id,
    eventType: "PREFERENCE_UPDATED",
    triggeredByUserId: platform.user.id,
    metadata: input as Record<string, unknown>,
  });

  return { id: updated.id };
}

function mapPreferenceContext(preference: {
  userId: string;
  enabledChannels: NotificationChannel[];
  disabledCategories: NotificationCategory[];
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  language: string;
  digestFrequency: UserPreferenceContext["digestFrequency"];
}): UserPreferenceContext {
  return {
    userId: preference.userId,
    enabledChannels: preference.enabledChannels,
    disabledCategories: preference.disabledCategories,
    quietHoursStart: preference.quietHoursStart,
    quietHoursEnd: preference.quietHoursEnd,
    language: preference.language,
    digestFrequency: preference.digestFrequency,
  };
}

export async function listNotificationInbox(platform: BusinessContext, filter?: InboxFilterInput) {
  assertPermission(platform, PERMISSION_CODES.NOTIFICATIONS_VIEW);

  const status = filter?.status;
  const category = filter?.category;
  const search = filter?.search?.trim();

  return prisma.notificationInboxItem.findMany({
    where: {
      userId: platform.user.id,
      businessId: platform.business.id,
      ...(status ? { status } : {}),
      ...(category ? { notification: { category } } : {}),
      ...(search
        ? {
            OR: [
              { notification: { title: { contains: search, mode: "insensitive" } } },
              { notification: { body: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { notification: true },
    orderBy: [{ pinnedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
}

export async function markInboxItemRead(
  platform: BusinessContext,
  inboxItemId: string,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.NOTIFICATIONS_VIEW);

  await prisma.notificationInboxItem.updateMany({
    where: {
      id: inboxItemId,
      userId: platform.user.id,
      businessId: platform.business.id,
    },
    data: { status: "READ", readAt: new Date() },
  });
}

export async function bulkInboxAction(
  platform: BusinessContext,
  input: BulkInboxActionInput,
): Promise<number> {
  assertPermission(platform, PERMISSION_CODES.NOTIFICATIONS_VIEW);

  const now = new Date();
  let data: Prisma.NotificationInboxItemUpdateManyMutationInput = {};

  switch (input.action) {
    case "read":
      data = { status: "READ", readAt: now };
      break;
    case "archive":
      data = { status: "ARCHIVED", archivedAt: now };
      break;
    case "pin":
      data = { status: "PINNED", pinnedAt: now };
      break;
    case "unpin":
      data = { status: "READ", pinnedAt: null };
      break;
  }

  const result = await prisma.notificationInboxItem.updateMany({
    where: {
      id: { in: input.inboxItemIds },
      userId: platform.user.id,
      businessId: platform.business.id,
    },
    data,
  });

  return result.count;
}

export async function trackDeliveryEngagement(
  deliveryId: string,
  action: "open" | "click",
): Promise<void> {
  const delivery = await prisma.notificationDelivery.findUnique({ where: { id: deliveryId } });
  if (!delivery) {
    return;
  }

  const now = new Date();
  const updateData =
    action === "open"
      ? { status: "OPENED" as const, openedAt: now }
      : { status: "CLICKED" as const, clickedAt: now };

  await prisma.notificationDelivery.update({
    where: { id: deliveryId },
    data: updateData,
  });

  await logAuditEvent({
    businessId: delivery.businessId,
    notificationId: delivery.notificationId,
    deliveryId: delivery.id,
    eventType: action === "open" ? "OPENED" : "CLICKED",
    recipientUserId: delivery.recipientUserId,
    channel: delivery.channel,
  });
}

export async function getUserNotificationPreferenceRecord(businessId: string, userId: string) {
  await getOrCreateUserPreferences(businessId, userId);
  return prisma.notificationUserPreference.findUniqueOrThrow({
    where: { userId_businessId: { userId, businessId } },
  });
}

export async function listNotificationTemplates(businessId: string) {
  return prisma.notificationTemplate.findMany({
    where: { businessId },
    orderBy: [{ slug: "asc" }, { version: "desc" }],
  });
}

export async function listNotificationDeliveryRules(businessId: string) {
  return prisma.notificationDeliveryRule.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listNotificationDeliveries(businessId: string, limit = 100) {
  return prisma.notificationDelivery.findMany({
    where: { businessId },
    orderBy: { queuedAt: "desc" },
    take: limit,
  });
}

export async function listNotificationChannelConfigs(businessId: string) {
  return prisma.notificationChannelConfig.findMany({
    where: { businessId },
    orderBy: { channel: "asc" },
  });
}

export async function listNotificationAuditLogs(businessId: string, limit = 100) {
  return prisma.notificationAuditLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getNotificationDashboard(
  businessId: string,
): Promise<NotificationDashboardMetrics> {
  const [
    totalNotifications,
    unreadInbox,
    queuedDeliveries,
    failedDeliveries,
    templates,
    deliveryRules,
    channelsConfigured,
  ] = await Promise.all([
    prisma.notification.count({ where: { businessId } }),
    prisma.notificationInboxItem.count({ where: { businessId, status: "UNREAD" } }),
    prisma.notificationDelivery.count({ where: { businessId, status: "QUEUED" } }),
    prisma.notificationDelivery.count({ where: { businessId, status: "FAILED" } }),
    prisma.notificationTemplate.count({ where: { businessId, isActive: true } }),
    prisma.notificationDeliveryRule.count({ where: { businessId, isActive: true } }),
    prisma.notificationChannelConfig.count({ where: { businessId, isEnabled: true } }),
  ]);

  return {
    totalNotifications,
    unreadInbox,
    queuedDeliveries,
    failedDeliveries,
    templates,
    deliveryRules,
    channelsConfigured,
  };
}

export async function renderNotificationTemplatePreview(
  templateId: string,
  variables: Record<string, string>,
): Promise<{ subject: string | null; body: string }> {
  const template = await prisma.notificationTemplate.findUnique({ where: { id: templateId } });
  if (!template) {
    throw new Error("Template not found");
  }

  return renderTemplate({
    subject: template.subject,
    body: template.body,
    variables,
  });
}

export async function publishNotificationFromPlatform(
  platform: BusinessContext,
  input: Omit<PublishNotificationInput, "businessId" | "triggeredByUserId">,
): Promise<PublishNotificationResult> {
  assertPermission(platform, PERMISSION_CODES.NOTIFICATIONS_PUBLISH);

  return publishNotificationEvent({
    ...input,
    businessId: platform.business.id,
    triggeredByUserId: platform.user.id,
  });
}
