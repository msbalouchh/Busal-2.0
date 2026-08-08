import type {
  NotificationCategory,
  NotificationChannel,
  NotificationDeliveryMode,
  NotificationPriority,
} from "@prisma/client";

import {
  deliverNotificationChannel,
  filterChannelsByPreferences,
} from "@/modules/notifications/engine/delivery-engine";
import {
  resolveChannelsFromRules,
  resolveDeliveryMode,
  selectApplicableRules,
  type DeliveryRuleRecord,
} from "@/modules/notifications/engine/rule-engine";
import { renderTemplate } from "@/modules/notifications/engine/template-engine";
import type {
  PublishNotificationInput,
  UserPreferenceContext,
} from "@/modules/notifications/types/notification-types";

export interface NotificationEnginePlan {
  mode: NotificationDeliveryMode;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  silent: boolean;
  renderedTitle: string;
  renderedBody: string;
  renderedSubject: string | null;
  applicableRuleIds: string[];
}

export function planNotificationDelivery(input: {
  publishInput: PublishNotificationInput;
  rules: DeliveryRuleRecord[];
  preferences: UserPreferenceContext[];
  template?: { subject: string | null; body: string } | null;
  defaultChannels?: NotificationChannel[];
}): NotificationEnginePlan {
  const variables = input.publishInput.templateVariables ?? {};
  const rendered = input.template
    ? renderTemplate({
        subject: input.template.subject,
        body: input.template.body,
        variables,
      })
    : { subject: null, body: input.publishInput.body };

  const context = {
    category: input.publishInput.category,
    priority: input.publishInput.priority ?? "NORMAL",
    now: new Date(),
  };

  const applicableRules = selectApplicableRules(input.rules, context);
  const mode = resolveDeliveryMode(applicableRules);
  const baseChannels =
    input.publishInput.channels ??
    resolveChannelsFromRules(applicableRules, input.defaultChannels ?? ["IN_APP", "EMAIL"]);

  const channels = new Set<NotificationChannel>();
  for (const preference of input.preferences) {
    for (const channel of filterChannelsByPreferences(
      baseChannels,
      preference,
      input.publishInput.category,
    )) {
      channels.add(channel);
    }
  }

  if (channels.size === 0 && input.preferences.length === 0) {
    for (const channel of baseChannels) {
      channels.add(channel);
    }
  }

  const silent = applicableRules.some((rule) => rule.silent);
  const priority =
    applicableRules.find((rule) => rule.priority !== "NORMAL")?.priority ??
    input.publishInput.priority ??
    "NORMAL";

  return {
    mode,
    priority,
    channels: Array.from(channels),
    silent,
    renderedTitle: input.publishInput.title,
    renderedBody: rendered.body,
    renderedSubject: rendered.subject,
    applicableRuleIds: applicableRules.map((rule) => rule.id),
  };
}

export async function deliverChannelNotification(input: {
  channel: NotificationChannel;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  recipientUserId?: string | null;
  subject?: string | null;
  body: string;
}) {
  return deliverNotificationChannel(input);
}

export function isCategoryAllowed(
  category: NotificationCategory,
  preferences: UserPreferenceContext[],
): boolean {
  return preferences.every((pref) => !pref.disabledCategories.includes(category));
}
