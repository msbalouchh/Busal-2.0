import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeAuditLog,
  serializeChannelConfig,
  serializeDelivery,
  serializeDeliveryRule,
  serializeInboxItem,
  serializeNotificationDashboard,
  serializeNotificationTemplate,
  serializeUserPreference,
} from "@/modules/notifications/utils/notification-utils";
import {
  ensureNotificationDefaults,
  getNotificationDashboard,
  getUserNotificationPreferenceRecord,
  listNotificationAuditLogs,
  listNotificationChannelConfigs,
  listNotificationDeliveries,
  listNotificationDeliveryRules,
  listNotificationInbox,
  listNotificationTemplates,
} from "@/services/notifications.service";

export const getNotificationsOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.NOTIFICATIONS_VIEW });
  await ensureNotificationDefaults(context.business.id);
  const dashboard = await getNotificationDashboard(context.business.id);

  return {
    context,
    dashboard: serializeNotificationDashboard(dashboard),
  };
});

export const getNotificationsInboxContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.NOTIFICATIONS_VIEW });
  const inbox = await listNotificationInbox(context);

  return {
    context,
    inbox: inbox.map(serializeInboxItem),
  };
});

export const getNotificationsTemplatesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.NOTIFICATIONS_VIEW });
  const templates = await listNotificationTemplates(context.business.id);

  return {
    context,
    templates: templates.map(serializeNotificationTemplate),
  };
});

export const getNotificationsRulesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.NOTIFICATIONS_VIEW });
  const rules = await listNotificationDeliveryRules(context.business.id);

  return {
    context,
    rules: rules.map(serializeDeliveryRule),
  };
});

export const getNotificationsChannelsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.NOTIFICATIONS_VIEW });
  const channels = await listNotificationChannelConfigs(context.business.id);

  return {
    context,
    channels: channels.map(serializeChannelConfig),
  };
});

export const getNotificationsDeliveriesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.NOTIFICATIONS_VIEW });
  const deliveries = await listNotificationDeliveries(context.business.id);

  return {
    context,
    deliveries: deliveries.map(serializeDelivery),
  };
});

export const getNotificationsPreferencesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.NOTIFICATIONS_VIEW });
  const preference = await getUserNotificationPreferenceRecord(
    context.business.id,
    context.user.id,
  );

  return {
    context,
    preference: serializeUserPreference(preference),
  };
});

export const getNotificationsAuditContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.NOTIFICATIONS_VIEW });
  const auditLogs = await listNotificationAuditLogs(context.business.id);

  return {
    context,
    auditLogs: auditLogs.map(serializeAuditLog),
  };
});
