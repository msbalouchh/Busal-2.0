import { NOTIFICATION_CHANNELS } from "@/modules/notifications/constants/routes";
import { registerNotificationChannel } from "@/modules/notifications/registry/notification-registry";
import type { ChannelDefinition } from "@/modules/notifications/types/notification-types";

const INTEGRATED_CHANNELS = new Set(["IN_APP", "EMAIL", "SMS", "PUSH", "WHATSAPP", "WEBHOOK"]);

export const DEFAULT_NOTIFICATION_CHANNELS: ChannelDefinition[] = NOTIFICATION_CHANNELS.map(
  (channel) => ({
    channel,
    name: formatChannelName(channel),
    description: getChannelDescription(channel),
    isIntegrated: INTEGRATED_CHANNELS.has(channel),
  }),
);

export const DEFAULT_NOTIFICATION_TEMPLATES = [
  {
    slug: "order-created",
    templateType: "IN_APP" as const,
    category: "ORDERS" as const,
    name: "Order Created",
    subject: "New order #{{orderNumber}}",
    body: "Order #{{orderNumber}} was created for {{customerName}}.",
    variables: [
      { key: "orderNumber", description: "Order number", required: true },
      { key: "customerName", description: "Customer name", required: true },
    ],
  },
  {
    slug: "security-alert",
    templateType: "EMAIL" as const,
    category: "SECURITY" as const,
    name: "Security Alert",
    subject: "Security alert for {{businessName}}",
    body: "A security event occurred: {{eventDescription}}.",
    variables: [
      { key: "businessName", description: "Business name", required: true },
      { key: "eventDescription", description: "Event description", required: true },
    ],
  },
] as const;

let bootstrapComplete = false;

export function registerBootstrapNotificationChannels(): void {
  for (const channel of DEFAULT_NOTIFICATION_CHANNELS) {
    registerNotificationChannel(channel);
  }
}

export function ensureBootstrapNotifications(): void {
  if (bootstrapComplete) {
    return;
  }

  registerBootstrapNotificationChannels();
  bootstrapComplete = true;
}

function formatChannelName(channel: string): string {
  return channel
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getChannelDescription(channel: string): string {
  const descriptions: Record<string, string> = {
    IN_APP: "In-app notification centre delivery",
    EMAIL: "Email delivery channel",
    SMS: "SMS text message delivery",
    PUSH: "Mobile push notification delivery",
    WHATSAPP: "WhatsApp message delivery",
    WEBHOOK: "HTTP webhook delivery",
    SLACK: "Slack integration (architecture ready)",
    TEAMS: "Microsoft Teams integration (architecture ready)",
    DISCORD: "Discord integration (architecture ready)",
  };

  return descriptions[channel] ?? `${channel} notification channel`;
}
