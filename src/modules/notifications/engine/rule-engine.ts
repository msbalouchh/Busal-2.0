import type {
  NotificationCategory,
  NotificationChannel,
  NotificationDeliveryMode,
  NotificationPriority,
} from "@prisma/client";

import type { DeliveryRuleEvaluationContext } from "@/modules/notifications/types/notification-types";

export interface DeliveryRuleRecord {
  id: string;
  mode: NotificationDeliveryMode;
  priority: NotificationPriority;
  category: NotificationCategory | null;
  channel: NotificationChannel | null;
  silent: boolean;
  businessHoursOnly: boolean;
  retryCount: number;
  retryDelayMinutes: number;
  isActive: boolean;
}

export function selectApplicableRules(
  rules: DeliveryRuleRecord[],
  context: DeliveryRuleEvaluationContext,
): DeliveryRuleRecord[] {
  return rules.filter((rule) => {
    if (!rule.isActive) {
      return false;
    }

    if (rule.category && rule.category !== context.category) {
      return false;
    }

    if (rule.businessHoursOnly && !isWithinBusinessHours(context.now)) {
      return false;
    }

    return true;
  });
}

export function resolveDeliveryMode(
  rules: DeliveryRuleRecord[],
  fallback: NotificationDeliveryMode = "IMMEDIATE",
): NotificationDeliveryMode {
  if (rules.length === 0) {
    return fallback;
  }

  const priorityOrder: NotificationDeliveryMode[] = ["IMMEDIATE", "RETRY", "SCHEDULED", "DIGEST"];
  for (const mode of priorityOrder) {
    if (rules.some((rule) => rule.mode === mode)) {
      return mode;
    }
  }

  return rules[0]?.mode ?? fallback;
}

export function resolveChannelsFromRules(
  rules: DeliveryRuleRecord[],
  defaultChannels: NotificationChannel[],
): NotificationChannel[] {
  const channels = rules
    .map((rule) => rule.channel)
    .filter((channel): channel is NotificationChannel => channel !== null);

  if (channels.length === 0) {
    return defaultChannels;
  }

  return Array.from(new Set(channels));
}

export function shouldRetryDelivery(retryCount: number, maxRetries: number): boolean {
  return retryCount < maxRetries;
}

function isWithinBusinessHours(now: Date): boolean {
  const hour = now.getHours();
  return hour >= 8 && hour < 18;
}
