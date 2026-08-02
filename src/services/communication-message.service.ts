import "server-only";

import type { PlatformChannelType, PlatformMessageDirection, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/communication-platform-context.service";
import { simulateMessageDelivery } from "@/services/communication-delivery-manager.service";
import { enqueueCommunicationMessage } from "@/services/communication-queue-manager.service";
import { writeCommunicationAuditLog } from "@/services/communication-audit-logger.service";

export async function listCommunicationMessages(
  ownerId: string,
  filters?: {
    status?: string;
    channel?: PlatformChannelType;
    direction?: PlatformMessageDirection;
    limit?: number;
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformCommunicationMessage.findMany({
    where: {
      businessId,
      ...(filters?.status ? { status: filters.status as never } : {}),
      ...(filters?.channel ? { channel: filters.channel } : {}),
      ...(filters?.direction ? { direction: filters.direction } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: filters?.limit ?? 50,
  });
}

export async function getUnifiedInbox(ownerId: string, limit = 50) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformCommunicationMessage.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function sendCommunicationMessage(
  ownerId: string,
  input: {
    channel: PlatformChannelType;
    recipient: string;
    subject?: string;
    content: string;
    direction?: PlatformMessageDirection;
    metadata?: Record<string, unknown>;
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const message = await prisma.platformCommunicationMessage.create({
    data: {
      businessId,
      channel: input.channel,
      recipient: input.recipient,
      subject: input.subject ?? "",
      content: input.content,
      direction: input.direction ?? "OUTBOUND",
      status: "QUEUED",
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });

  await enqueueCommunicationMessage(businessId, message.id);
  await writeCommunicationAuditLog(businessId, {
    action: "message.queued",
    entityId: message.id,
    message: `Message queued to ${input.recipient}`,
  });

  return simulateMessageDelivery(ownerId, message.id);
}

export async function markMessageRead(ownerId: string, messageId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const message = await prisma.platformCommunicationMessage.findFirst({
    where: { id: messageId, businessId },
  });
  if (!message) return null;

  return prisma.platformCommunicationMessage.update({
    where: { id: messageId },
    data: { status: "READ" },
  });
}

export async function searchCommunicationMessages(ownerId: string, query: string, limit = 20) {
  const businessId = await getOwnedBusinessId(ownerId);
  const trimmed = query.trim();
  if (!trimmed) return [];

  return prisma.platformCommunicationMessage.findMany({
    where: {
      businessId,
      OR: [
        { recipient: { contains: trimmed, mode: "insensitive" } },
        { subject: { contains: trimmed, mode: "insensitive" } },
        { content: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
