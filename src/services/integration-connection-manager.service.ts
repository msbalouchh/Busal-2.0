import "server-only";

import type { Prisma, IntegrationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  decryptCredentials,
  encryptCredentials,
  maskCredentialValue,
} from "@/services/integration-credential-crypto.service";
import { getOwnedBusinessId } from "@/services/integration-context.service";
import { writeIntegrationLog } from "@/services/integration-logger.service";
import { dispatchIntegrationEvent } from "@/services/integration-event-dispatcher.service";

export async function listIntegrationConnections(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.integrationConnection.findMany({
    where: { businessId },
    include: { provider: { select: { name: true, slug: true, category: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getIntegrationConnection(ownerId: string, connectionId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.integrationConnection.findFirst({
    where: { id: connectionId, businessId },
    include: { provider: true },
  });
}

export async function createIntegrationConnection(
  ownerId: string,
  input: {
    providerId: string;
    displayName: string;
    credentials?: Record<string, string>;
    configuration?: Record<string, unknown>;
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const provider = await prisma.integrationProvider.findFirst({
    where: { id: input.providerId, businessId },
  });
  if (!provider) throw new Error("Provider not found");

  const encryptedCredentials = input.credentials
    ? encryptCredentials(JSON.stringify(input.credentials))
    : "";

  const connection = await prisma.integrationConnection.create({
    data: {
      businessId,
      providerId: input.providerId,
      displayName: input.displayName,
      status: "INACTIVE",
      credentials: encryptedCredentials,
      configuration: (input.configuration ?? {}) as Prisma.InputJsonValue,
    },
    include: { provider: true },
  });

  await writeIntegrationLog(businessId, {
    connectionId: connection.id,
    level: "INFO",
    message: `Connection created: ${connection.displayName}`,
  });
  await dispatchIntegrationEvent("connection.created", { businessId, connectionId: connection.id });

  return connection;
}

export async function updateIntegrationConnection(
  ownerId: string,
  connectionId: string,
  input: {
    displayName?: string;
    status?: IntegrationStatus;
    configuration?: Record<string, unknown>;
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const updated = await prisma.integrationConnection.updateMany({
    where: { id: connectionId, businessId },
    data: {
      ...(input.displayName ? { displayName: input.displayName } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.configuration
        ? { configuration: input.configuration as Prisma.InputJsonValue }
        : {}),
    },
  });
  if (updated.count === 0) throw new Error("Connection not found");
  return getIntegrationConnection(ownerId, connectionId);
}

export async function deleteIntegrationConnection(ownerId: string, connectionId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const result = await prisma.integrationConnection.deleteMany({
    where: { id: connectionId, businessId },
  });
  if (result.count === 0) throw new Error("Connection not found");
  await dispatchIntegrationEvent("connection.deleted", { businessId, connectionId });
}

export async function testIntegrationConnection(ownerId: string, connectionId: string) {
  const connection = await getIntegrationConnection(ownerId, connectionId);
  if (!connection) throw new Error("Connection not found");

  if (!connection.credentials) {
    return { success: false, message: "No credentials configured" };
  }

  try {
    const parsed = JSON.parse(decryptCredentials(connection.credentials)) as Record<string, string>;
    const hasRequired = Object.keys(parsed).length > 0;
    if (!hasRequired) {
      return { success: false, message: "Credentials are empty" };
    }

    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: { status: "ACTIVE" },
    });

    await writeIntegrationLog(connection.businessId, {
      connectionId: connection.id,
      level: "INFO",
      message: "Connection test simulated successfully",
    });

    return { success: true, message: "Connection test simulated" };
  } catch {
    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: { status: "ERROR" },
    });
    return { success: false, message: "Connection test failed" };
  }
}

export function getMaskedCredentials(connection: { credentials: string }): Record<string, string> {
  if (!connection.credentials) return {};
  try {
    const parsed = JSON.parse(decryptCredentials(connection.credentials)) as Record<string, string>;
    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key, maskCredentialValue(value)]),
    );
  } catch {
    return { credentials: "••••••••" };
  }
}
