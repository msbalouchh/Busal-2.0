import { COMMUNICATION_CHANNELS } from "@/modules/communication/constants/routes";
import { registerCommunicationChannel } from "@/modules/communication/registry/communication-registry";
import type { ChannelConnectorDefinition } from "@/modules/communication/types/communication-types";

let bootstrapComplete = false;

export const DEFAULT_COMMUNICATION_CHANNELS: ChannelConnectorDefinition[] =
  COMMUNICATION_CHANNELS.map((channel) => ({
    channel,
    name: formatChannelName(channel),
    description: getChannelDescription(channel),
    isIntegrated: false,
  }));

export function registerBootstrapCommunicationChannels(): void {
  for (const connector of DEFAULT_COMMUNICATION_CHANNELS) {
    registerCommunicationChannel(connector);
  }
}

export function ensureBootstrapCommunication(): void {
  if (bootstrapComplete) {
    return;
  }

  registerBootstrapCommunicationChannels();
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
    EMAIL: "Email connector (architecture ready)",
    WHATSAPP: "WhatsApp connector (architecture ready)",
    SMS: "SMS connector (architecture ready)",
    LIVE_CHAT: "Live chat connector (architecture ready)",
    FACEBOOK_MESSENGER: "Facebook Messenger connector (architecture ready)",
    INSTAGRAM_DIRECT: "Instagram Direct connector (architecture ready)",
    WEB_CONTACT_FORM: "Web contact form connector (architecture ready)",
  };

  return descriptions[channel] ?? `${channel} communication channel`;
}
