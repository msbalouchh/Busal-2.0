import "server-only";

import { runCustomerAiChat } from "@/modules/customer-ai/services/customer-ai-chat.service";
import { adaptOutboundToChannelCapabilities } from "@/modules/customer-ai/omnichannel/constants/channel-capabilities";
import { sendOutboundWithAdapter } from "@/modules/customer-ai/omnichannel/adapters/adapter-registry";
import {
  decryptChannelCredentials,
} from "@/modules/customer-ai/omnichannel/services/channel-credentials.service";
import {
  logOmnichannelEvent,
  recordMessageDedup,
} from "@/modules/customer-ai/omnichannel/services/channel-observability.service";
import { OMNICHANNEL_EVENT_TYPES } from "@/modules/customer-ai/omnichannel/constants/channel-events";
import { updateChannelConnectionStatus } from "@/modules/customer-ai/omnichannel/services/channel-connection.service";
import type {
  OmnichannelOutboundMessage,
  OutboundDeliveryResult,
} from "@/modules/customer-ai/omnichannel/types/omnichannel.types";
import type { CustomerAiChatResult } from "@/modules/customer-ai/types/customer-ai.types";
import type { CustomerAiChannel } from "@/modules/customer-ai/types/customer-ai.types";
import type { CustomerAiChannelProvider } from "@prisma/client";

export async function deliverOutboundMessage(input: {
  connectionId: string;
  businessId: string;
  channel: CustomerAiChannel;
  provider: CustomerAiChannelProvider;
  encryptedCredentials: string;
  message: OmnichannelOutboundMessage;
}): Promise<OutboundDeliveryResult> {
  const credentials = decryptChannelCredentials(input.encryptedCredentials);
  const adapted = adaptOutboundToChannelCapabilities(input.channel, {
    content: input.message.content,
    quickReplies: input.message.quickReplies,
    buttons: input.message.buttons,
  });

  const result = await sendOutboundWithAdapter({
    channel: input.channel,
    provider: input.provider,
    credentials,
    message: { ...input.message, ...adapted },
  });

  await logOmnichannelEvent({
    businessId: input.businessId,
    channel: input.channel,
    eventType: result.success
      ? OMNICHANNEL_EVENT_TYPES.OUTBOUND_SENT
      : OMNICHANNEL_EVENT_TYPES.DELIVERY_FAILURE,
    connectionId: input.connectionId,
    externalMessageId: result.externalMessageId,
    metadata: {
      success: result.success,
      error: result.error,
    },
  });

  if (result.externalMessageId) {
    await recordMessageDedup({
      businessId: input.businessId,
      connectionId: input.connectionId,
      externalMessageId: result.externalMessageId,
      channel: input.channel,
      direction: "outbound",
    });
  }

  if (!result.success) {
    const status =
      result.error?.toLowerCase().includes("token") ||
      result.error?.toLowerCase().includes("auth")
        ? "REQUIRES_REAUTH"
        : "ERROR";
    await updateChannelConnectionStatus(input.connectionId, status, result.error ?? "Delivery failed");
  }

  return result;
}

export async function deliverCustomerAiReply(input: {
  connectionId: string;
  businessId: string;
  channel: CustomerAiChannel;
  provider: CustomerAiChannelProvider;
  encryptedCredentials: string;
  externalAccountId: string;
  externalConversationId: string;
  externalCustomerId: string;
  chatResult: CustomerAiChatResult;
}): Promise<OutboundDeliveryResult> {
  const message: OmnichannelOutboundMessage = {
    businessId: input.businessId,
    channel: input.channel,
    externalAccountId: input.externalAccountId,
    externalConversationId: input.externalConversationId,
    externalCustomerId: input.externalCustomerId,
    content: input.chatResult.content,
    aiName: input.chatResult.aiName,
    aiAvatarUrl: input.chatResult.aiAvatarUrl,
    metadata: {
      conversationId: input.chatResult.conversationId,
    },
  };

  await logOmnichannelEvent({
    businessId: input.businessId,
    channel: input.channel,
    eventType: OMNICHANNEL_EVENT_TYPES.AI_RESPONSE,
    connectionId: input.connectionId,
    metadata: { conversationId: input.chatResult.conversationId },
  });

  return deliverOutboundMessage({
    connectionId: input.connectionId,
    businessId: input.businessId,
    channel: input.channel,
    provider: input.provider,
    encryptedCredentials: input.encryptedCredentials,
    message,
  });
}

export function buildAiResultFromChat(result: CustomerAiChatResult): Record<string, unknown> {
  return {
    content: result.content,
    conversationId: result.conversationId,
    sessionToken: result.sessionToken,
    aiName: result.aiName,
    escalated: result.escalated,
  };
}

export async function sendDirectAiMessage(input: Parameters<typeof runCustomerAiChat>[0]): Promise<CustomerAiChatResult> {
  return runCustomerAiChat(input);
}
