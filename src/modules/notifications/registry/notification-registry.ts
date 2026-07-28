import type { ChannelDefinition } from "@/modules/notifications/types/notification-types";

const channels = new Map<string, ChannelDefinition>();

export function registerNotificationChannel(definition: ChannelDefinition): void {
  channels.set(definition.channel, definition);
}

export function listNotificationChannels(): ChannelDefinition[] {
  return Array.from(channels.values());
}

export function getNotificationChannel(
  channel: ChannelDefinition["channel"],
): ChannelDefinition | undefined {
  return channels.get(channel);
}
