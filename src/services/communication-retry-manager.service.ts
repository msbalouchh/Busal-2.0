import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/communication-platform-context.service";
import { simulateMessageDelivery } from "@/services/communication-delivery-manager.service";

const MAX_RETRY_ATTEMPTS = 3;

export async function retryFailedMessages(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const failed = await prisma.platformCommunicationMessage.findMany({
    where: { businessId, status: "FAILED" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  let retried = 0;
  for (const message of failed) {
    const metadata = message.metadata as Record<string, unknown>;
    const attempts = Number(metadata.retryAttempts ?? 0);
    if (attempts >= MAX_RETRY_ATTEMPTS) continue;

    await prisma.platformCommunicationMessage.update({
      where: { id: message.id },
      data: {
        status: "QUEUED",
        metadata: {
          ...metadata,
          retryAttempts: attempts + 1,
          lastRetryAt: new Date().toISOString(),
        } as unknown as Prisma.InputJsonValue,
      },
    });

    await simulateMessageDelivery(ownerId, message.id);
    retried += 1;
  }

  return retried;
}

export async function retryCommunicationMessage(ownerId: string, messageId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const message = await prisma.platformCommunicationMessage.findFirst({
    where: { id: messageId, businessId, status: "FAILED" },
  });
  if (!message) throw new Error("Failed message not found");

  const metadata = message.metadata as Record<string, unknown>;
  const attempts = Number(metadata.retryAttempts ?? 0);
  if (attempts >= MAX_RETRY_ATTEMPTS) throw new Error("Maximum retry attempts reached");

  await prisma.platformCommunicationMessage.update({
    where: { id: messageId },
    data: {
      status: "QUEUED",
      metadata: {
        ...metadata,
        retryAttempts: attempts + 1,
      } as unknown as Prisma.InputJsonValue,
    },
  });

  return simulateMessageDelivery(ownerId, messageId);
}
