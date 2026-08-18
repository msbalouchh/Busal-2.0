import "server-only";

import { CUSTOMER_AI_CHANNELS } from "@/modules/customer-ai/constants/customer-ai.constants";
import type { ChannelAdapter } from "@/modules/customer-ai/omnichannel/adapters/adapter.types";
import type {
  ChannelConnectionCredentials,
  OmnichannelInboundMessage,
  OmnichannelOutboundMessage,
  OutboundDeliveryResult,
} from "@/modules/customer-ai/omnichannel/types/omnichannel.types";

const META_GRAPH_VERSION = "v19.0";

function readMetaMessages(payload: Record<string, unknown>): OmnichannelInboundMessage[] {
  const businessId = String(payload.__businessId ?? "");
  const externalAccountId = String(payload.__externalAccountId ?? "");
  const channel = payload.__channel as typeof CUSTOMER_AI_CHANNELS.WHATSAPP;
  const entry = Array.isArray(payload.entry) ? payload.entry : [];
  const messages: OmnichannelInboundMessage[] = [];

  for (const entryItem of entry) {
    const item = entryItem as Record<string, unknown>;
    const changes = Array.isArray(item.changes) ? item.changes : [];
    for (const change of changes) {
      const value = (change as Record<string, unknown>).value as Record<string, unknown> | undefined;
      if (!value) continue;

      if (channel === CUSTOMER_AI_CHANNELS.WHATSAPP) {
        const waMessages = Array.isArray(value.messages) ? value.messages : [];
        const contacts = Array.isArray(value.contacts) ? value.contacts : [];
        const contactName =
          typeof (contacts[0] as Record<string, unknown>)?.profile === "object"
            ? String(
                ((contacts[0] as Record<string, unknown>).profile as Record<string, unknown>)
                  ?.name ?? "",
              ) || null
            : null;

        for (const raw of waMessages) {
          const msg = raw as Record<string, unknown>;
          const text =
            typeof (msg.text as Record<string, unknown>)?.body === "string"
              ? String((msg.text as Record<string, unknown>).body)
              : typeof msg.body === "string"
                ? msg.body
                : "";
          if (!text.trim()) continue;
          messages.push({
            businessId,
            channel,
            externalAccountId: String(value.metadata ? (value.metadata as Record<string, unknown>).phone_number_id : externalAccountId),
            externalConversationId: String(msg.from ?? "unknown"),
            externalMessageId: String(msg.id ?? `${Date.now()}`),
            customerIdentifier: String(msg.from ?? "unknown"),
            customerDisplayName: contactName,
            messageText: text.trim(),
            attachments: [],
            timestamp: new Date(Number(msg.timestamp ?? Date.now()) * 1000),
            channelMetadata: { raw: msg },
          });
        }
        continue;
      }

      const pageMessages = Array.isArray(value.messaging) ? value.messaging : [];
      for (const raw of pageMessages) {
        const msg = raw as Record<string, unknown>;
        const message = msg.message as Record<string, unknown> | undefined;
        if (!message) continue;
        const text = typeof message.text === "string" ? message.text : "";
        if (!text.trim()) continue;
        const sender = msg.sender as Record<string, unknown> | undefined;
        messages.push({
          businessId,
          channel,
          externalAccountId: String(value.metadata ? (value.metadata as Record<string, unknown>).page_id : externalAccountId),
          externalConversationId: String(sender?.id ?? "unknown"),
          externalMessageId: String(message.mid ?? msg.timestamp ?? Date.now()),
          customerIdentifier: String(sender?.id ?? "unknown"),
          customerDisplayName: null,
          messageText: text.trim(),
          attachments: [],
          timestamp: new Date(Number(msg.timestamp ?? Date.now())),
          channelMetadata: { raw: msg },
        });
      }
    }
  }

  return messages;
}

async function sendMetaMessage(input: {
  credentials: ChannelConnectionCredentials;
  recipientId: string;
  text: string;
  phoneNumberId?: string;
}): Promise<OutboundDeliveryResult> {
  const accessToken = input.credentials.accessToken ?? process.env.META_PAGE_ACCESS_TOKEN;
  if (!accessToken) {
    return { success: false, error: "Meta access token not configured" };
  }

  const url = input.phoneNumberId
    ? `https://graph.facebook.com/${META_GRAPH_VERSION}/${input.phoneNumberId}/messages`
    : `https://graph.facebook.com/${META_GRAPH_VERSION}/me/messages`;

  const body = input.phoneNumberId
    ? {
        messaging_product: "whatsapp",
        to: input.recipientId.replace(/^whatsapp:/, ""),
        type: "text",
        text: { body: input.text },
      }
    : {
        recipient: { id: input.recipientId },
        message: { text: input.text },
      };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    return {
      success: false,
      error: String((payload.error as Record<string, unknown>)?.message ?? response.statusText),
      providerResponse: payload,
    };
  }

  const messageId =
    typeof (payload.messages as Array<{ id?: string }> | undefined)?.[0]?.id === "string"
      ? (payload.messages as Array<{ id: string }>)[0]?.id
      : typeof payload.message_id === "string"
        ? payload.message_id
        : undefined;

  return { success: true, externalMessageId: messageId, providerResponse: payload };
}

function createMetaAdapter(channel: typeof CUSTOMER_AI_CHANNELS.WHATSAPP | typeof CUSTOMER_AI_CHANNELS.FACEBOOK | typeof CUSTOMER_AI_CHANNELS.INSTAGRAM): ChannelAdapter {
  return {
    channel,
    parseInbound: ({ businessId, externalAccountId, payload }) =>
      readMetaMessages({
        ...payload,
        __businessId: businessId,
        __externalAccountId: externalAccountId,
        __channel: channel,
      }),
    buildOutboundPayload: (message) => ({
      to: message.externalCustomerId,
      text: message.content,
    }),
    sendOutbound: async ({ credentials, message }) =>
      sendMetaMessage({
        credentials,
        recipientId: message.externalCustomerId,
        text: message.content,
        phoneNumberId:
          channel === CUSTOMER_AI_CHANNELS.WHATSAPP
            ? credentials.phoneNumberId ?? process.env.META_WHATSAPP_PHONE_NUMBER_ID
            : undefined,
      }),
    resolveExternalAccountId: (payload) => {
      const entry = Array.isArray(payload.entry) ? payload.entry : [];
      for (const entryItem of entry) {
        const changes = Array.isArray((entryItem as Record<string, unknown>).changes)
          ? ((entryItem as Record<string, unknown>).changes as unknown[])
          : [];
        for (const change of changes) {
          const value = (change as Record<string, unknown>).value as Record<string, unknown> | undefined;
          const metadata = value?.metadata as Record<string, unknown> | undefined;
          if (channel === CUSTOMER_AI_CHANNELS.WHATSAPP && metadata?.phone_number_id) {
            return String(metadata.phone_number_id);
          }
          if (metadata?.page_id) return String(metadata.page_id);
        }
      }
      return null;
    },
  };
}

export const whatsappAdapter = createMetaAdapter(CUSTOMER_AI_CHANNELS.WHATSAPP);
export const facebookAdapter = createMetaAdapter(CUSTOMER_AI_CHANNELS.FACEBOOK);
export const instagramAdapter = createMetaAdapter(CUSTOMER_AI_CHANNELS.INSTAGRAM);

export const twilioWhatsappAdapter: ChannelAdapter = {
  channel: CUSTOMER_AI_CHANNELS.WHATSAPP,
  parseInbound: ({ businessId, externalAccountId, payload }) => {
    const text = typeof payload.Body === "string" ? payload.Body : "";
    if (!text.trim()) return [];
    return [
      {
        businessId,
        channel: CUSTOMER_AI_CHANNELS.WHATSAPP,
        externalAccountId,
        externalConversationId: String(payload.From ?? "unknown"),
        externalMessageId: String(payload.MessageSid ?? Date.now()),
        customerIdentifier: String(payload.From ?? "unknown"),
        customerDisplayName: typeof payload.ProfileName === "string" ? payload.ProfileName : null,
        messageText: text.trim(),
        attachments: [],
        timestamp: new Date(),
        channelMetadata: payload,
      },
    ];
  },
  buildOutboundPayload: (message) => ({ to: message.externalCustomerId, body: message.content }),
  sendOutbound: async ({ credentials, message }) => {
    const accountSid = credentials.accountSid ?? process.env.TWILIO_ACCOUNT_SID;
    const authToken = credentials.authToken ?? process.env.TWILIO_AUTH_TOKEN;
    const from = credentials.whatsappFrom ?? process.env.TWILIO_WHATSAPP_FROM;
    if (!accountSid || !authToken || !from) {
      return { success: false, error: "Twilio WhatsApp credentials not configured" };
    }

    const basic = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const body = new URLSearchParams({
      To: message.externalCustomerId.startsWith("whatsapp:")
        ? message.externalCustomerId
        : `whatsapp:${message.externalCustomerId}`,
      From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
      Body: message.content,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );

    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      return { success: false, error: String(payload.message ?? response.statusText), providerResponse: payload };
    }
    return {
      success: true,
      externalMessageId: typeof payload.sid === "string" ? payload.sid : undefined,
      providerResponse: payload,
    };
  },
  resolveExternalAccountId: (payload) =>
    typeof payload.To === "string" ? payload.To.replace(/^whatsapp:/, "") : null,
};
