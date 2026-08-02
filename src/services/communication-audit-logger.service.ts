import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/communication-platform-context.service";

export async function writeCommunicationAuditLog(
  businessId: string,
  input: { action: string; entityId: string; message: string; metadata?: Record<string, unknown> },
) {
  const channel = await prisma.platformCommunicationChannel.findFirst({
    where: { businessId },
    select: { id: true, configuration: true },
    orderBy: { createdAt: "asc" },
  });

  if (!channel) return;

  const configuration = (channel.configuration ?? {}) as Record<string, unknown>;
  const logs = Array.isArray(configuration.auditLogs)
    ? (configuration.auditLogs as Array<Record<string, unknown>>)
    : [];

  logs.unshift({
    action: input.action,
    entityId: input.entityId,
    message: input.message,
    timestamp: new Date().toISOString(),
    ...(input.metadata ?? {}),
  });

  await prisma.platformCommunicationChannel.update({
    where: { id: channel.id },
    data: {
      configuration: {
        ...configuration,
        auditLogs: logs.slice(0, 100),
      } as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function listCommunicationAuditLogs(ownerId: string, limit = 50) {
  const businessId = await getOwnedBusinessId(ownerId);
  const channel = await prisma.platformCommunicationChannel.findFirst({
    where: { businessId },
    select: { configuration: true },
    orderBy: { createdAt: "asc" },
  });
  if (!channel) return [];

  const configuration = (channel.configuration ?? {}) as Record<string, unknown>;
  const logs = Array.isArray(configuration.auditLogs)
    ? (configuration.auditLogs as Array<Record<string, unknown>>)
    : [];

  return logs.slice(0, limit).map((log, index) => ({
    id: String(log.entityId ?? index),
    action: String(log.action ?? ""),
    message: String(log.message ?? ""),
    timestamp: String(log.timestamp ?? ""),
  }));
}
