import { CUSTOMER_AI_CHANNELS } from "@/modules/customer-ai/constants/customer-ai.constants";
import type { CustomerAiChannel } from "@/modules/customer-ai/types/customer-ai.types";

export interface ChannelCapabilityMatrix {
  text: boolean;
  images: boolean;
  files: boolean;
  buttons: boolean;
  quickReplies: boolean;
  templates: boolean;
  conversationWindows: boolean;
  customerIdentity: boolean;
  typingIndicators: boolean;
  readReceipts: boolean;
}

export const CHANNEL_CAPABILITY_MATRIX: Record<CustomerAiChannel, ChannelCapabilityMatrix> = {
  [CUSTOMER_AI_CHANNELS.WEBSITE]: {
    text: true,
    images: true,
    files: true,
    buttons: true,
    quickReplies: true,
    templates: false,
    conversationWindows: false,
    customerIdentity: false,
    typingIndicators: true,
    readReceipts: false,
  },
  [CUSTOMER_AI_CHANNELS.EMBED]: {
    text: true,
    images: true,
    files: true,
    buttons: true,
    quickReplies: true,
    templates: false,
    conversationWindows: false,
    customerIdentity: false,
    typingIndicators: true,
    readReceipts: false,
  },
  [CUSTOMER_AI_CHANNELS.PORTAL]: {
    text: true,
    images: true,
    files: true,
    buttons: true,
    quickReplies: true,
    templates: false,
    conversationWindows: false,
    customerIdentity: true,
    typingIndicators: true,
    readReceipts: false,
  },
  [CUSTOMER_AI_CHANNELS.LIVE_CHAT]: {
    text: true,
    images: true,
    files: true,
    buttons: true,
    quickReplies: true,
    templates: false,
    conversationWindows: false,
    customerIdentity: true,
    typingIndicators: true,
    readReceipts: true,
  },
  [CUSTOMER_AI_CHANNELS.WHATSAPP]: {
    text: true,
    images: true,
    files: true,
    buttons: true,
    quickReplies: true,
    templates: true,
    conversationWindows: true,
    customerIdentity: true,
    typingIndicators: false,
    readReceipts: true,
  },
  [CUSTOMER_AI_CHANNELS.INSTAGRAM]: {
    text: true,
    images: true,
    files: false,
    buttons: false,
    quickReplies: true,
    templates: false,
    conversationWindows: true,
    customerIdentity: true,
    typingIndicators: false,
    readReceipts: true,
  },
  [CUSTOMER_AI_CHANNELS.FACEBOOK]: {
    text: true,
    images: true,
    files: true,
    buttons: true,
    quickReplies: true,
    templates: false,
    conversationWindows: true,
    customerIdentity: true,
    typingIndicators: true,
    readReceipts: true,
  },
  [CUSTOMER_AI_CHANNELS.TIKTOK]: {
    text: true,
    images: false,
    files: false,
    buttons: false,
    quickReplies: false,
    templates: false,
    conversationWindows: true,
    customerIdentity: true,
    typingIndicators: false,
    readReceipts: false,
  },
};

export function getChannelCapabilities(channel: CustomerAiChannel): ChannelCapabilityMatrix {
  return CHANNEL_CAPABILITY_MATRIX[channel];
}

export type OutboundChannelButton = { id: string; label: string; url?: string };

export function adaptOutboundToChannelCapabilities(
  channel: CustomerAiChannel,
  message: { content: string; quickReplies?: string[]; buttons?: OutboundChannelButton[] },
): { content: string; quickReplies?: string[]; buttons?: OutboundChannelButton[] } {
  const caps = getChannelCapabilities(channel);
  return {
    content: message.content,
    quickReplies: caps.quickReplies ? message.quickReplies : undefined,
    buttons: caps.buttons ? message.buttons : undefined,
  };
}
