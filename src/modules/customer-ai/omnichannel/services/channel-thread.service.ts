import "server-only";

import { prisma } from "@/lib/prisma";
import { createCustomerAiSession } from "@/modules/customer-ai/services/customer-identity.service";
import type { CustomerAiChannel } from "@/modules/customer-ai/types/customer-ai.types";

export async function getOrCreateExternalThread(input: {
  businessId: string;
  connectionId: string;
  channel: CustomerAiChannel;
  externalConversationId: string;
  externalCustomerId: string;
  customerDisplayName?: string | null;
}): Promise<{
  id: string;
  aiConversationId: string | null;
  sessionToken: string | null;
  handoffToHuman: boolean;
  communicationConversationId: string | null;
}> {
  const existing = await prisma.customerAiExternalThread.findUnique({
    where: {
      connectionId_externalConversationId: {
        connectionId: input.connectionId,
        externalConversationId: input.externalConversationId,
      },
    },
  });

  if (existing) {
    await prisma.customerAiExternalThread.update({
      where: { id: existing.id },
      data: {
        lastMessageAt: new Date(),
        customerDisplayName: input.customerDisplayName ?? existing.customerDisplayName,
      },
    });
    return {
      id: existing.id,
      aiConversationId: existing.aiConversationId,
      sessionToken: existing.sessionToken,
      handoffToHuman: existing.handoffToHuman,
      communicationConversationId: existing.communicationConversationId,
    };
  }

  const session = await createCustomerAiSession({
    businessId: input.businessId,
    channel: input.channel,
  });

  const created = await prisma.customerAiExternalThread.create({
    data: {
      businessId: input.businessId,
      connectionId: input.connectionId,
      channel: input.channel,
      externalConversationId: input.externalConversationId,
      externalCustomerId: input.externalCustomerId,
      customerDisplayName: input.customerDisplayName ?? null,
      sessionToken: session.sessionToken,
    },
  });

  return {
    id: created.id,
    aiConversationId: created.aiConversationId,
    sessionToken: created.sessionToken,
    handoffToHuman: created.handoffToHuman,
    communicationConversationId: created.communicationConversationId,
  };
}

export async function linkExternalThreadToConversation(input: {
  threadId: string;
  aiConversationId: string;
}): Promise<void> {
  await prisma.customerAiExternalThread.update({
    where: { id: input.threadId },
    data: { aiConversationId: input.aiConversationId },
  });
}

export async function markExternalThreadHandoff(input: {
  threadId: string;
  communicationConversationId?: string;
}): Promise<void> {
  await prisma.customerAiExternalThread.update({
    where: { id: input.threadId },
    data: {
      handoffToHuman: true,
      handoffAt: new Date(),
      communicationConversationId: input.communicationConversationId ?? undefined,
    },
  });
}

export async function isExternalThreadHandedOff(threadId: string): Promise<boolean> {
  const thread = await prisma.customerAiExternalThread.findUnique({
    where: { id: threadId },
    select: { handoffToHuman: true },
  });
  return Boolean(thread?.handoffToHuman);
}
