import "server-only";

import type { CommunicationChannel } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { escalateCustomerConversation } from "@/modules/customer-ai/services/customer-ai-analytics.service";
import { CUSTOMER_AI_CHANNELS } from "@/modules/customer-ai/constants/customer-ai.constants";
import { markExternalThreadHandoff } from "@/modules/customer-ai/omnichannel/services/channel-thread.service";
import { recordAiEscalation } from "@/modules/customer-ai/omnichannel/services/channel-observability.service";
import type { CustomerAiChannel } from "@/modules/customer-ai/types/customer-ai.types";

function mapToCommunicationChannel(channel: CustomerAiChannel): CommunicationChannel {
  switch (channel) {
    case CUSTOMER_AI_CHANNELS.WHATSAPP:
      return "WHATSAPP";
    case CUSTOMER_AI_CHANNELS.FACEBOOK:
      return "FACEBOOK_MESSENGER";
    case CUSTOMER_AI_CHANNELS.INSTAGRAM:
      return "INSTAGRAM_DIRECT";
    default:
      return "LIVE_CHAT";
  }
}

export async function escalateExternalThreadToHuman(input: {
  businessId: string;
  channel: CustomerAiChannel;
  threadId: string;
  aiConversationId: string;
  customerDisplayName?: string | null;
  subject: string;
  reason: string;
  connectionId?: string;
}): Promise<string | null> {
  await escalateCustomerConversation(input.businessId, input.aiConversationId);

  let communicationConversationId: string | null = null;

  try {
    const conversation = await prisma.communicationConversation.create({
      data: {
        businessId: input.businessId,
        sourceChannel: mapToCommunicationChannel(input.channel),
        inboxType: "TEAM",
        subject: input.subject.slice(0, 120),
        status: "OPEN",
        tags: ["ai-escalation", input.channel],
      },
    });
    communicationConversationId = conversation.id;

    await prisma.communicationMessage.create({
      data: {
        businessId: input.businessId,
        conversationId: conversation.id,
        messageType: "SYSTEM",
        senderType: "SYSTEM",
        channel: mapToCommunicationChannel(input.channel),
        body: `AI escalation: ${input.reason}`,
        deliveryStatus: "DELIVERED",
      },
    });
  } catch {
    // Communication module optional — AI conversation escalation still recorded
  }

  await markExternalThreadHandoff({
    threadId: input.threadId,
    communicationConversationId: communicationConversationId ?? undefined,
  });

  await recordAiEscalation({
    businessId: input.businessId,
    channel: input.channel,
    conversationId: input.aiConversationId,
    connectionId: input.connectionId,
    reason: input.reason,
  });

  return communicationConversationId;
}

export function customerRequestedHuman(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("speak to a human") ||
    normalized.includes("talk to a person") ||
    normalized.includes("real person") ||
    normalized.includes("human agent") ||
    normalized.includes("customer service")
  );
}
