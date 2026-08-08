import type { NotificationChannel, NotificationDeliveryStatus, PlatformChannelType } from "@prisma/client";

import { bootstrapCommunicationProviders } from "@/services/communication-provider-manager.service";
import { getCommunicationProviderRegistry } from "@/services/communication-provider-registry.service";
import type { UserPreferenceContext } from "@/modules/notifications/types/notification-types";

export interface DeliveryResult {
  status: NotificationDeliveryStatus;
  sentAt: Date;
  deliveredAt: Date | null;
  deliveryTimeMs: number;
  errorMessage: string | null;
}

const CHANNEL_TO_PLATFORM: Partial<Record<NotificationChannel, PlatformChannelType>> = {
  EMAIL: "EMAIL",
  SMS: "SMS",
  WHATSAPP: "WHATSAPP",
  PUSH: "PUSH",
};

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

export async function deliverNotificationChannel(input: {
  channel: NotificationChannel;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  recipientUserId?: string | null;
  subject?: string | null;
  body: string;
}): Promise<DeliveryResult> {
  const sentAt = new Date();

  if (input.channel === "IN_APP") {
    const deliveredAt = new Date();
    return {
      status: "DELIVERED",
      sentAt,
      deliveredAt,
      deliveryTimeMs: deliveredAt.getTime() - sentAt.getTime(),
      errorMessage: null,
    };
  }

  const platformChannel = CHANNEL_TO_PLATFORM[input.channel];
  if (!platformChannel) {
    return {
      status: "QUEUED",
      sentAt,
      deliveredAt: null,
      deliveryTimeMs: 0,
      errorMessage: null,
    };
  }

  bootstrapCommunicationProviders();
  const registry = getCommunicationProviderRegistry();
  const provider = registry.list().find((entry) => entry.channelType === platformChannel);

  if (!provider?.isAvailable()) {
    return {
      status: "FAILED",
      sentAt,
      deliveredAt: null,
      deliveryTimeMs: Date.now() - sentAt.getTime(),
      errorMessage: `Provider for ${input.channel} is not configured`,
    };
  }

  const recipient =
    input.channel === "EMAIL"
      ? input.recipientEmail
      : input.channel === "PUSH"
        ? input.recipientUserId
        : input.recipientPhone;

  if (!recipient) {
    return {
      status: "FAILED",
      sentAt,
      deliveredAt: null,
      deliveryTimeMs: Date.now() - sentAt.getTime(),
      errorMessage: `Missing recipient for ${input.channel}`,
    };
  }

  const result = await provider.sendMessage({
    recipient,
    subject: input.subject ?? undefined,
    content: input.body,
  });

  if (!result.success) {
    return {
      status: "FAILED",
      sentAt,
      deliveredAt: null,
      deliveryTimeMs: Date.now() - sentAt.getTime(),
      errorMessage: result.message,
    };
  }

  const deliveredAt = new Date();
  return {
    status: "DELIVERED",
    sentAt,
    deliveredAt,
    deliveryTimeMs: deliveredAt.getTime() - sentAt.getTime(),
    errorMessage: null,
  };
}

/** @deprecated Use deliverNotificationChannel */
export function simulateDelivery(channel: NotificationChannel): DeliveryResult {
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
