import "server-only";

import { runCustomerAiChat } from "@/modules/customer-ai/services/customer-ai-chat.service";
import { parseInboundWithAdapter } from "@/modules/customer-ai/omnichannel/adapters/adapter-registry";
import {
  resolveConnectionByExternalAccount,
  markWebhookVerified,
} from "@/modules/customer-ai/omnichannel/services/channel-connection.service";
import {
  getOrCreateExternalThread,
  linkExternalThreadToConversation,
} from "@/modules/customer-ai/omnichannel/services/channel-thread.service";
import { getChannelAiSettings } from "@/modules/customer-ai/omnichannel/services/channel-settings.service";
import { resolveOutsideHoursResponse } from "@/modules/customer-ai/omnichannel/services/business-hours-behavior.service";
import {
  customerRequestedHuman,
  escalateExternalThreadToHuman,
} from "@/modules/customer-ai/omnichannel/services/channel-handoff.service";
import {
  deliverCustomerAiReply,
  deliverOutboundMessage,
} from "@/modules/customer-ai/omnichannel/services/outbound-message.service";
import {
  logOmnichannelEvent,
  recordMessageDedup,
} from "@/modules/customer-ai/omnichannel/services/channel-observability.service";
import { OMNICHANNEL_EVENT_TYPES } from "@/modules/customer-ai/omnichannel/constants/channel-events";
import type {
  InboundProcessingResult,
  OmnichannelInboundMessage,
} from "@/modules/customer-ai/omnichannel/types/omnichannel.types";
import type { CustomerAiChannel } from "@/modules/customer-ai/types/customer-ai.types";
import type { CustomerAiChannelProvider } from "@prisma/client";

export async function processNormalizedInboundMessage(input: {
  connectionId: string;
  businessId: string;
  channel: CustomerAiChannel;
  provider: CustomerAiChannelProvider;
  encryptedCredentials: string;
  externalAccountId: string;
  message: OmnichannelInboundMessage;
}): Promise<InboundProcessingResult> {
  const isNew = await recordMessageDedup({
    businessId: input.businessId,
    connectionId: input.connectionId,
    externalMessageId: input.message.externalMessageId,
    channel: input.channel,
    direction: "inbound",
  });

  if (!isNew) {
    return { processed: true, duplicate: true, aiResponseSent: false };
  }

  await logOmnichannelEvent({
    businessId: input.businessId,
    channel: input.channel,
    eventType: OMNICHANNEL_EVENT_TYPES.INBOUND_RECEIVED,
    connectionId: input.connectionId,
    externalMessageId: input.message.externalMessageId,
  });

  const thread = await getOrCreateExternalThread({
    businessId: input.businessId,
    connectionId: input.connectionId,
    channel: input.channel,
    externalConversationId: input.message.externalConversationId,
    externalCustomerId: input.message.customerIdentifier,
    customerDisplayName: input.message.customerDisplayName,
  });

  if (thread.handoffToHuman) {
    return {
      processed: true,
      duplicate: false,
      skippedReason: "handoff_to_human",
      aiResponseSent: false,
      externalThreadId: thread.id,
      conversationId: thread.aiConversationId ?? undefined,
    };
  }

  const settings = await getChannelAiSettings(input.businessId, input.channel);
  if (!settings.aiEnabled) {
    return {
      processed: true,
      duplicate: false,
      skippedReason: "ai_disabled",
      aiResponseSent: false,
      externalThreadId: thread.id,
    };
  }

  if (settings.humanEscalationEnabled && customerRequestedHuman(input.message.messageText)) {
    const conversationId =
      thread.aiConversationId ??
      (
        await runCustomerAiChat({
          businessId: input.businessId,
          message: input.message.messageText,
          conversationId: thread.aiConversationId ?? undefined,
          sessionToken: thread.sessionToken ?? undefined,
          channel: input.channel,
        })
      ).conversationId;

    await linkExternalThreadToConversation({
      threadId: thread.id,
      aiConversationId: conversationId,
    });

    await escalateExternalThreadToHuman({
      businessId: input.businessId,
      channel: input.channel,
      threadId: thread.id,
      aiConversationId: conversationId,
      customerDisplayName: input.message.customerDisplayName,
      subject: input.message.messageText,
      reason: "Customer requested human assistance",
      connectionId: input.connectionId,
    });

    const handoffMessage =
      "I've connected you with our team. A staff member will follow up with you shortly.";

    await deliverOutboundMessage({
      connectionId: input.connectionId,
      businessId: input.businessId,
      channel: input.channel,
      provider: input.provider,
      encryptedCredentials: input.encryptedCredentials,
      message: {
        businessId: input.businessId,
        channel: input.channel,
        externalAccountId: input.externalAccountId,
        externalConversationId: input.message.externalConversationId,
        externalCustomerId: input.message.customerIdentifier,
        content: handoffMessage,
        aiName: "Assistant",
        aiAvatarUrl: null,
      },
    });

    return {
      processed: true,
      duplicate: false,
      aiResponseSent: true,
      escalated: true,
      conversationId,
      externalThreadId: thread.id,
    };
  }

  const outsideHours = await resolveOutsideHoursResponse({
    businessId: input.businessId,
    settings,
  });

  if (!outsideHours.shouldRespond) {
    if (outsideHours.escalate && thread.aiConversationId) {
      await escalateExternalThreadToHuman({
        businessId: input.businessId,
        channel: input.channel,
        threadId: thread.id,
        aiConversationId: thread.aiConversationId,
        subject: input.message.messageText,
        reason: "Outside business hours escalation rule",
        connectionId: input.connectionId,
      });
    }
    return {
      processed: true,
      duplicate: false,
      skippedReason: "outside_hours",
      aiResponseSent: false,
      externalThreadId: thread.id,
    };
  }

  if (outsideHours.message && !thread.aiConversationId) {
    await deliverOutboundMessage({
      connectionId: input.connectionId,
      businessId: input.businessId,
      channel: input.channel,
      provider: input.provider,
      encryptedCredentials: input.encryptedCredentials,
      message: {
        businessId: input.businessId,
        channel: input.channel,
        externalAccountId: input.externalAccountId,
        externalConversationId: input.message.externalConversationId,
        externalCustomerId: input.message.customerIdentifier,
        content: outsideHours.message,
        aiName: "Assistant",
        aiAvatarUrl: null,
      },
    });
    return {
      processed: true,
      duplicate: false,
      aiResponseSent: true,
      externalThreadId: thread.id,
    };
  }

  let chatResult;
  try {
    chatResult = await runCustomerAiChat({
      businessId: input.businessId,
      message: input.message.messageText,
      conversationId: thread.aiConversationId ?? undefined,
      sessionToken: thread.sessionToken ?? undefined,
      channel: input.channel,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "AI processing failed";
    if (settings.autoEscalateOnFailure && thread.aiConversationId) {
      await escalateExternalThreadToHuman({
        businessId: input.businessId,
        channel: input.channel,
        threadId: thread.id,
        aiConversationId: thread.aiConversationId,
        subject: input.message.messageText,
        reason: errorMessage,
        connectionId: input.connectionId,
      });
    }
    return {
      processed: false,
      duplicate: false,
      skippedReason: errorMessage,
      aiResponseSent: false,
      externalThreadId: thread.id,
    };
  }

  await linkExternalThreadToConversation({
    threadId: thread.id,
    aiConversationId: chatResult.conversationId,
  });

  if (chatResult.escalated) {
    await escalateExternalThreadToHuman({
      businessId: input.businessId,
      channel: input.channel,
      threadId: thread.id,
      aiConversationId: chatResult.conversationId,
      subject: input.message.messageText,
      reason: "AI marked conversation for escalation",
      connectionId: input.connectionId,
    });
  }

  const delivery = await deliverCustomerAiReply({
    connectionId: input.connectionId,
    businessId: input.businessId,
    channel: input.channel,
    provider: input.provider,
    encryptedCredentials: input.encryptedCredentials,
    externalAccountId: input.externalAccountId,
    externalConversationId: input.message.externalConversationId,
    externalCustomerId: input.message.customerIdentifier,
    chatResult,
  });

  return {
    processed: true,
    duplicate: false,
    aiResponseSent: delivery.success,
    conversationId: chatResult.conversationId,
    externalThreadId: thread.id,
    escalated: chatResult.escalated,
  };
}

export async function processChannelWebhookPayload(input: {
  channel: CustomerAiChannel;
  externalAccountId: string;
  payload: Record<string, unknown>;
}): Promise<InboundProcessingResult[]> {
  const connection = await resolveConnectionByExternalAccount({
    channel: input.channel,
    externalAccountId: input.externalAccountId,
  });

  if (!connection) {
    return [{ processed: false, duplicate: false, aiResponseSent: false, skippedReason: "connection_not_found" }];
  }

  await markWebhookVerified(connection.id);

  const messages = parseInboundWithAdapter({
    channel: input.channel,
    provider: connection.provider,
    businessId: connection.businessId,
    externalAccountId: input.externalAccountId,
    payload: input.payload,
  });

  const results: InboundProcessingResult[] = [];
  for (const message of messages) {
    results.push(
      await processNormalizedInboundMessage({
        connectionId: connection.id,
        businessId: connection.businessId,
        channel: input.channel,
        provider: connection.provider,
        encryptedCredentials: connection.encryptedCredentials,
        externalAccountId: input.externalAccountId,
        message,
      }),
    );
  }

  return results;
}
