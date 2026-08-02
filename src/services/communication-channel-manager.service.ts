import "server-only";

import type { PlatformChannelStatus, PlatformChannelType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/communication-platform-context.service";
import { writeCommunicationAuditLog } from "@/services/communication-audit-logger.service";

export async function listCommunicationChannels(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformCommunicationChannel.findMany({
    where: { businessId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createCommunicationChannel(
  ownerId: string,
  input: { name: string; type: PlatformChannelType; configuration?: Record<string, unknown> },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const channel = await prisma.platformCommunicationChannel.create({
    data: {
      businessId,
      name: input.name,
      type: input.type,
      status: "INACTIVE",
      configuration: (input.configuration ?? {}) as Prisma.InputJsonValue,
    },
  });
  await writeCommunicationAuditLog(businessId, {
    action: "channel.created",
    entityId: channel.id,
    message: `Channel created: ${channel.name}`,
  });
  return channel;
}

export async function updateCommunicationChannel(
  ownerId: string,
  channelId: string,
  input: {
    name?: string;
    status?: PlatformChannelStatus;
    configuration?: Record<string, unknown>;
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformCommunicationChannel.findFirst({
    where: { id: channelId, businessId },
  });
  if (!existing) return null;

  return prisma.platformCommunicationChannel.update({
    where: { id: channelId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.configuration !== undefined
        ? { configuration: input.configuration as Prisma.InputJsonValue }
        : {}),
    },
  });
}

export async function deleteCommunicationChannel(ownerId: string, channelId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformCommunicationChannel.findFirst({
    where: { id: channelId, businessId },
  });
  if (!existing) return false;
  await prisma.platformCommunicationChannel.delete({ where: { id: channelId } });
  await writeCommunicationAuditLog(businessId, {
    action: "channel.deleted",
    entityId: channelId,
    message: `Channel deleted: ${existing.name}`,
  });
  return true;
}
