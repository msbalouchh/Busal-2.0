import "server-only";

import type { CustomerAiChannel } from "@/modules/customer-ai/types/customer-ai.types";
import { CUSTOMER_AI_CHANNELS } from "@/modules/customer-ai/constants/customer-ai.constants";

export type MessagingChannelStatus = "implemented" | "requires_credentials" | "architecture_only";

export interface MessagingChannelDefinition {
  channel: CustomerAiChannel;
  name: string;
  description: string;
  status: MessagingChannelStatus;
  webhookPath?: string;
  requiredCredentials: string[];
  requiredApprovals: string[];
}

/**
 * Messaging channel registry — separates IMPLEMENTED from REQUIRES EXTERNAL PROVIDER.
 * All channels route through the same customer-ai brain once connected.
 */
export const MESSAGING_CHANNEL_REGISTRY: MessagingChannelDefinition[] = [
  {
    channel: CUSTOMER_AI_CHANNELS.WEBSITE,
    name: "Website Chat",
    description: "Embedded chat widget on business website",
    status: "implemented",
    webhookPath: "/api/customer-ai/chat",
    requiredCredentials: [],
    requiredApprovals: [],
  },
  {
    channel: CUSTOMER_AI_CHANNELS.EMBED,
    name: "Embed Widget",
    description: "Signed embed token chat widget",
    status: "implemented",
    webhookPath: "/api/embed/chat",
    requiredCredentials: ["PLATFORM_EMBED_SECRET"],
    requiredApprovals: [],
  },
  {
    channel: CUSTOMER_AI_CHANNELS.WHATSAPP,
    name: "WhatsApp",
    description: "WhatsApp Business messaging via Meta Cloud API or Twilio",
    status: "implemented",
    webhookPath: "/api/webhooks/messaging/whatsapp",
    requiredCredentials: ["META_APP_SECRET", "META_PAGE_ACCESS_TOKEN", "META_WHATSAPP_PHONE_NUMBER_ID"],
    requiredApprovals: ["WhatsApp Business API approval"],
  },
  {
    channel: CUSTOMER_AI_CHANNELS.INSTAGRAM,
    name: "Instagram Direct",
    description: "Instagram DM via Meta Graph API",
    status: "implemented",
    webhookPath: "/api/webhooks/messaging/instagram",
    requiredCredentials: ["META_APP_ID", "META_APP_SECRET", "META_PAGE_ACCESS_TOKEN"],
    requiredApprovals: ["Meta Business verification", "Instagram messaging permissions"],
  },
  {
    channel: CUSTOMER_AI_CHANNELS.FACEBOOK,
    name: "Facebook Messenger",
    description: "Facebook Messenger via Meta Graph API",
    status: "implemented",
    webhookPath: "/api/webhooks/messaging/facebook",
    requiredCredentials: ["META_APP_ID", "META_APP_SECRET", "META_PAGE_ACCESS_TOKEN"],
    requiredApprovals: ["Meta Business verification", "Messenger permissions"],
  },
  {
    channel: CUSTOMER_AI_CHANNELS.TIKTOK,
    name: "TikTok Messaging",
    description: "TikTok Business messaging — requires TikTok Business API approval",
    status: "requires_credentials",
    webhookPath: "/api/webhooks/messaging/tiktok",
    requiredCredentials: ["TIKTOK_BUSINESS_APP_ID", "TIKTOK_BUSINESS_APP_SECRET", "TIKTOK_BUSINESS_ACCESS_TOKEN"],
    requiredApprovals: ["TikTok Business API approval"],
  },
];

export interface NormalizedInboundMessage {
  businessId: string;
  channel: CustomerAiChannel;
  externalConversationId: string;
  externalSenderId: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface NormalizedOutboundMessage {
  content: string;
  aiName: string;
  aiAvatarUrl: string | null;
}

export function normalizeInboundMessage(input: {
  businessId: string;
  channel: CustomerAiChannel;
  payload: Record<string, unknown>;
}): NormalizedInboundMessage | null {
  const message =
    typeof input.payload.message === "string"
      ? input.payload.message
      : typeof input.payload.text === "string"
        ? input.payload.text
        : null;

  if (!message?.trim()) return null;

  return {
    businessId: input.businessId,
    channel: input.channel,
    externalConversationId: String(input.payload.conversationId ?? input.payload.from ?? "unknown"),
    externalSenderId: String(input.payload.from ?? input.payload.senderId ?? "unknown"),
    message: message.trim(),
    metadata: input.payload,
  };
}

export function listMessagingChannels(): MessagingChannelDefinition[] {
  return MESSAGING_CHANNEL_REGISTRY;
}

export function getMessagingChannel(
  channel: CustomerAiChannel,
): MessagingChannelDefinition | undefined {
  return MESSAGING_CHANNEL_REGISTRY.find((entry) => entry.channel === channel);
}
