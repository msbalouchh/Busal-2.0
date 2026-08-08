import "server-only";

import { randomBytes } from "node:crypto";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/communication-platform-context.service";
import { getCommunicationProviderRegistry } from "@/services/communication-provider-registry.service";

const MAX_DELIVERY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 500;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendWithRetry(
  send: () => Promise<{ success: boolean; providerReference?: string; message?: string }>,
): Promise<{ success: boolean; providerReference: string; message: string; attempts: number }> {
  let lastMessage = "Delivery failed";

  for (let attempt = 1; attempt <= MAX_DELIVERY_ATTEMPTS; attempt += 1) {
    const result = await send();
    if (result.success) {
      return {
        success: true,
        providerReference: result.providerReference ?? `msg_${randomBytes(8).toString("hex")}`,
        message: result.message ?? "Delivered",
        attempts: attempt,
      };
    }

    lastMessage = result.message ?? lastMessage;
    if (attempt < MAX_DELIVERY_ATTEMPTS) {
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  return {
    success: false,
    providerReference: "",
    message: lastMessage,
    attempts: MAX_DELIVERY_ATTEMPTS,
  };
}

export async function deliverMessage(ownerId: string, messageId: string) {
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

  const delivery = await sendWithRetry(async () => {
    if (!provider?.isAvailable()) {
      return { success: false, message: "Provider not configured" };
    }

    const result = await provider.sendMessage({
      recipient: message.recipient,
      subject: message.subject,
      content: message.content,
    });

    return {
      success: result.success,
      providerReference: result.providerReference,
      message: result.message,
    };
  });

  const sentAt = new Date();
  const status = delivery.success ? "DELIVERED" : "FAILED";

  return prisma.platformCommunicationMessage.update({
    where: { id: messageId },
    data: {
      status,
      providerReference: delivery.providerReference || undefined,
      sentAt: delivery.success ? sentAt : null,
      metadata: {
        ...(message.metadata as Record<string, unknown>),
        deliveryVerified: delivery.success,
        deliveryAttempts: delivery.attempts,
        deliveredAt: delivery.success ? sentAt.toISOString() : null,
        deliveryError: delivery.success ? null : delivery.message,
      } as unknown as Prisma.InputJsonValue,
    },
  });
}

/** @deprecated Use deliverMessage */
export async function simulateMessageDelivery(ownerId: string, messageId: string) {
  return deliverMessage(ownerId, messageId);
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
    attempts: metadata.deliveryAttempts ?? 1,
  };
}
