import "server-only";

import { prisma } from "@/lib/prisma";
import {
  decryptCredentials,
  encryptCredentials,
} from "@/services/integration-credential-crypto.service";
import { getOwnedBusinessId } from "@/services/integration-context.service";
import { writeIntegrationLog } from "@/services/integration-logger.service";

export async function saveConnectionCredentials(
  ownerId: string,
  connectionId: string,
  credentials: Record<string, string>,
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const connection = await prisma.integrationConnection.findFirst({
    where: { id: connectionId, businessId },
  });
  if (!connection) throw new Error("Connection not found");

  const encrypted = encryptCredentials(JSON.stringify(credentials));
  await prisma.integrationConnection.update({
    where: { id: connectionId },
    data: { credentials: encrypted },
  });

  await writeIntegrationLog(businessId, {
    connectionId,
    level: "INFO",
    message: "Credentials updated",
  });
}

export async function rotateConnectionCredentials(
  ownerId: string,
  connectionId: string,
  newCredentials: Record<string, string>,
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const connection = await prisma.integrationConnection.findFirst({
    where: { id: connectionId, businessId },
  });
  if (!connection) throw new Error("Connection not found");

  const encrypted = encryptCredentials(JSON.stringify(newCredentials));
  await prisma.integrationConnection.update({
    where: { id: connectionId },
    data: { credentials: encrypted, status: "INACTIVE" },
  });

  await writeIntegrationLog(businessId, {
    connectionId,
    level: "INFO",
    message: "Credentials rotated — re-test connection required",
  });
}

export async function getConnectionCredentialsForProcessing(
  ownerId: string,
  connectionId: string,
): Promise<Record<string, string> | null> {
  const businessId = await getOwnedBusinessId(ownerId);
  const connection = await prisma.integrationConnection.findFirst({
    where: { id: connectionId, businessId },
    select: { credentials: true },
  });
  if (!connection?.credentials) return null;
  try {
    return JSON.parse(decryptCredentials(connection.credentials)) as Record<string, string>;
  } catch {
    return null;
  }
}
