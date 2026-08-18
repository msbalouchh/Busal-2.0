import "server-only";

import { CUSTOMER_AI_CHANNELS } from "@/modules/customer-ai/constants/customer-ai.constants";
import type { ChannelAdapter } from "@/modules/customer-ai/omnichannel/adapters/adapter.types";
import {
  facebookAdapter,
  instagramAdapter,
  twilioWhatsappAdapter,
  whatsappAdapter,
} from "@/modules/customer-ai/omnichannel/adapters/meta-messaging.adapters";
import type {
  ChannelConnectionCredentials,
  OmnichannelInboundMessage,
  OmnichannelOutboundMessage,
  OutboundDeliveryResult,
} from "@/modules/customer-ai/omnichannel/types/omnichannel.types";
import type { CustomerAiChannel } from "@/modules/customer-ai/types/customer-ai.types";

/** TikTok Business Messaging — application-side adapter; live API requires provider approval. */
export const tiktokAdapter: ChannelAdapter = {
  channel: CUSTOMER_AI_CHANNELS.TIKTOK,
  parseInbound: ({ businessId, externalAccountId, payload }) => {
    const event = payload.event as Record<string, unknown> | undefined;
    const content = event?.content as Record<string, unknown> | undefined;
    const text = typeof content?.text === "string" ? content.text : "";
    if (!text.trim()) return [];
    return [
      {
        businessId,
        channel: CUSTOMER_AI_CHANNELS.TIKTOK,
        externalAccountId,
        externalConversationId: String(event?.conversation_id ?? "unknown"),
        externalMessageId: String(event?.message_id ?? Date.now()),
        customerIdentifier: String(event?.sender_id ?? "unknown"),
        customerDisplayName:
          typeof event?.sender_name === "string" ? event.sender_name : null,
        messageText: text.trim(),
        attachments: [],
        timestamp: new Date(),
        channelMetadata: payload,
      },
    ];
  },
  buildOutboundPayload: (message) => ({
    conversation_id: message.externalConversationId,
    text: message.content,
  }),
  sendOutbound: async ({ credentials, message }) => {
    const accessToken = credentials.accessToken ?? process.env.TIKTOK_BUSINESS_ACCESS_TOKEN;
    if (!accessToken) {
      return {
        success: false,
        error: "TikTok Business access token not configured — EXTERNAL PROVIDER APPROVAL REQUIRED",
      };
    }

    const response = await fetch("https://business-api.tiktok.com/open_api/v1.3/message/send/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversation_id: message.externalConversationId,
        content: { text: message.content },
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      return {
        success: false,
        error: String(payload.message ?? response.statusText),
        providerResponse: payload,
      };
    }

    return {
      success: true,
      externalMessageId: String(payload.message_id ?? ""),
      providerResponse: payload,
    };
  },
  resolveExternalAccountId: (payload) =>
    typeof payload.business_id === "string" ? payload.business_id : null,
};

const ADAPTERS: Record<CustomerAiChannel, ChannelAdapter | null> = {
  [CUSTOMER_AI_CHANNELS.WHATSAPP]: whatsappAdapter,
  [CUSTOMER_AI_CHANNELS.FACEBOOK]: facebookAdapter,
  [CUSTOMER_AI_CHANNELS.INSTAGRAM]: instagramAdapter,
  [CUSTOMER_AI_CHANNELS.TIKTOK]: tiktokAdapter,
  [CUSTOMER_AI_CHANNELS.WEBSITE]: null,
  [CUSTOMER_AI_CHANNELS.EMBED]: null,
  [CUSTOMER_AI_CHANNELS.PORTAL]: null,
  [CUSTOMER_AI_CHANNELS.LIVE_CHAT]: null,
};

export function getChannelAdapter(
  channel: CustomerAiChannel,
  provider?: ChannelConnectionCredentials["provider"],
): ChannelAdapter | null {
  if (channel === CUSTOMER_AI_CHANNELS.WHATSAPP && provider === "TWILIO") {
    return twilioWhatsappAdapter;
  }
  return ADAPTERS[channel] ?? null;
}

export function parseInboundWithAdapter(input: {
  channel: CustomerAiChannel;
  provider?: ChannelConnectionCredentials["provider"];
  businessId: string;
  externalAccountId: string;
  payload: Record<string, unknown>;
}): OmnichannelInboundMessage[] {
  const adapter = getChannelAdapter(input.channel, input.provider);
  if (!adapter) return [];
  return adapter.parseInbound({
    businessId: input.businessId,
    externalAccountId: input.externalAccountId,
    payload: input.payload,
  });
}

export async function sendOutboundWithAdapter(input: {
  channel: CustomerAiChannel;
  provider: ChannelConnectionCredentials["provider"];
  credentials: ChannelConnectionCredentials;
  message: OmnichannelOutboundMessage;
}): Promise<OutboundDeliveryResult> {
  const adapter = getChannelAdapter(input.channel, input.provider);
  if (!adapter) {
    return { success: false, error: `No outbound adapter for channel ${input.channel}` };
  }
  return adapter.sendOutbound({ credentials: input.credentials, message: input.message });
}

export function resolveExternalAccountFromPayload(
  channel: CustomerAiChannel,
  provider: ChannelConnectionCredentials["provider"] | undefined,
  payload: Record<string, unknown>,
): string | null {
  const adapter = getChannelAdapter(channel, provider);
  return adapter?.resolveExternalAccountId(payload) ?? null;
}
