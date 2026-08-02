import "server-only";

import { randomBytes } from "node:crypto";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/communication-platform-context.service";
import { getCommunicationProviderRegistry } from "@/services/communication-provider-registry.service";

export async function simulateMessageDelivery(ownerId: string, messageId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const message = await prisma.platformCommunicationMessage.findFirst({
    where: { id: messageId, businessId },
  });
  if (!message) throw new Error("Message not found");

  await prisma.platformCommunicationMessage.update({
    where: { id: messageId },
    data: { status: "PROCESSING" },
  });

  const registry = getCommunicationProviderRegistry();
  const provider = registry.list().find((item) => item.channelType === message.channel);
  const providerReference = `sim_${randomBytes(8).toString("hex")}`;

  if (provider?.isAvailable()) {
    await provider.sendMessage({
      recipient: message.recipient,
      subject: message.subject,
      content: message.content,
    });
  }

  const sentAt = new Date();
  return prisma.platformCommunicationMessage.update({
    where: { id: messageId },
    data: {
      status: "DELIVERED",
      providerReference,
      sentAt,
      metadata: {
        ...(message.metadata as Record<string, unknown>),
        simulated: true,
        deliveryVerified: true,
        deliveredAt: sentAt.toISOString(),
      } as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function verifyDelivery(ownerId: string, messageId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const message = await prisma.platformCommunicationMessage.findFirst({
    where: { id: messageId, businessId },
  });
  if (!message) return { verified: false };

  const metadata = message.metadata as Record<string, unknown>;
  return {
    verified: Boolean(metadata.deliveryVerified) || message.status === "DELIVERED",
    status: message.status,
    providerReference: message.providerReference,
  };
}
