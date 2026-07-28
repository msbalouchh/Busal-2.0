import type { NotificationChannel, NotificationDeliveryStatus } from "@prisma/client";

import type { UserPreferenceContext } from "@/modules/notifications/types/notification-types";

export interface DeliverySimulationResult {
  status: NotificationDeliveryStatus;
  sentAt: Date;
  deliveredAt: Date | null;
  deliveryTimeMs: number;
  errorMessage: string | null;
}

export function filterChannelsByPreferences(
  channels: NotificationChannel[],
  preferences: UserPreferenceContext,
  category: UserPreferenceContext["disabledCategories"][number],
): NotificationChannel[] {
  if (preferences.disabledCategories.includes(category)) {
    return [];
  }

  if (isInQuietHours(preferences.quietHoursStart, preferences.quietHoursEnd, new Date())) {
    return channels.filter((channel) => channel === "IN_APP");
  }

  return channels.filter((channel) => preferences.enabledChannels.includes(channel));
}

export function simulateDelivery(channel: NotificationChannel): DeliverySimulationResult {
  const sentAt = new Date();
  const deliveryTimeMs = channel === "IN_APP" ? 10 : channel === "EMAIL" ? 250 : 500;
  const deliveredAt = new Date(sentAt.getTime() + deliveryTimeMs);

  if (
    channel === "WEBHOOK" ||
    channel === "SLACK" ||
    channel === "TEAMS" ||
    channel === "DISCORD"
  ) {
    return {
      status: "QUEUED",
      sentAt,
      deliveredAt: null,
      deliveryTimeMs: 0,
      errorMessage: null,
    };
  }

  return {
    status: "DELIVERED",
    sentAt,
    deliveredAt,
    deliveryTimeMs,
    errorMessage: null,
  };
}

export function nextDeliveryStatus(
  current: NotificationDeliveryStatus,
  action: "open" | "click",
): NotificationDeliveryStatus {
  if (action === "open" && (current === "DELIVERED" || current === "SENT")) {
    return "OPENED";
  }

  if (
    action === "click" &&
    (current === "OPENED" || current === "DELIVERED" || current === "SENT")
  ) {
    return "CLICKED";
  }

  return current;
}

function isInQuietHours(start: string | null, end: string | null, now: Date): boolean {
  if (!start || !end) {
    return false;
  }

  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = (startHour ?? 0) * 60 + (startMin ?? 0);
  const endMinutes = (endHour ?? 0) * 60 + (endMin ?? 0);

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}
