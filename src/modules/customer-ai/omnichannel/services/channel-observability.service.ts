import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { CUSTOMER_AI_EVENT_TYPES } from "@/modules/customer-ai/constants/customer-ai.constants";
import { recordCustomerAiEvent } from "@/modules/customer-ai/services/customer-ai-analytics.service";
import { OMNICHANNEL_EVENT_TYPES } from "@/modules/customer-ai/omnichannel/constants/channel-events";
import type { CustomerAiChannel } from "@/modules/customer-ai/types/customer-ai.types";

export async function logOmnichannelEvent(input: {
  businessId: string;
  channel: CustomerAiChannel;
  eventType: string;
  connectionId?: string;
  externalMessageId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const safeMetadata = { ...(input.metadata ?? {}) };
  for (const key of Object.keys(safeMetadata)) {
    const lower = key.toLowerCase();
    if (
      lower.includes("token") ||
      lower.includes("secret") ||
      lower.includes("password") ||
      lower.includes("credential")
    ) {
      delete safeMetadata[key];
    }
  }

  await recordCustomerAiEvent({
    businessId: input.businessId,
    eventType: input.eventType,
    channel: input.channel,
    metadata: {
      connectionId: input.connectionId,
      externalMessageId: input.externalMessageId,
      ...safeMetadata,
    },
  });

  console.info(
    JSON.stringify({
      scope: "customer-ai-omnichannel",
      businessId: input.businessId,
      channel: input.channel,
      eventType: input.eventType,
      connectionId: input.connectionId,
      externalMessageId: input.externalMessageId,
      ...safeMetadata,
    }),
  );
}

export async function recordMessageDedup(input: {
  businessId: string;
  connectionId: string;
  externalMessageId: string;
  channel: CustomerAiChannel;
  direction: "inbound" | "outbound";
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  try {
    await prisma.customerAiChannelMessageDedup.create({
      data: {
        businessId: input.businessId,
        connectionId: input.connectionId,
        externalMessageId: input.externalMessageId,
        channel: input.channel,
        direction: input.direction,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
    return true;
  } catch {
    await logOmnichannelEvent({
      businessId: input.businessId,
      channel: input.channel,
      eventType: OMNICHANNEL_EVENT_TYPES.DUPLICATE_MESSAGE,
      connectionId: input.connectionId,
      externalMessageId: input.externalMessageId,
    });
    return false;
  }
}

export async function recordAiEscalation(input: {
  businessId: string;
  channel: CustomerAiChannel;
  conversationId: string;
  connectionId?: string;
  reason: string;
}): Promise<void> {
  await logOmnichannelEvent({
    businessId: input.businessId,
    channel: input.channel,
    eventType: OMNICHANNEL_EVENT_TYPES.ESCALATION,
    metadata: {
      conversationId: input.conversationId,
      connectionId: input.connectionId,
      reason: input.reason,
    },
  });

  await recordCustomerAiEvent({
    businessId: input.businessId,
    conversationId: input.conversationId,
    eventType: CUSTOMER_AI_EVENT_TYPES.ESCALATED,
    channel: input.channel,
    metadata: { reason: input.reason },
  });
}
