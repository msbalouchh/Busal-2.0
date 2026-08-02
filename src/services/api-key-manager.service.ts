import "server-only";

import type { PlatformApiStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  generateApiKeyValue,
  getOwnedBusinessId,
  hashApiKey,
  maskSecret,
} from "@/services/developer-platform-context.service";

export interface CreatedApiKeyResult {
  id: string;
  name: string;
  rawKey: string;
  maskedKey: string;
  expiresAt: Date | null;
}

export async function listApiKeys(ownerId: string, applicationId?: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformApiKey.findMany({
    where: {
      businessId,
      ...(applicationId ? { applicationId } : {}),
    },
    include: { application: { select: { name: true, clientId: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createApiKey(
  ownerId: string,
  input: {
    applicationId: string;
    name: string;
    permissions?: string[];
    expiresAt?: Date;
  },
): Promise<CreatedApiKeyResult | null> {
  const businessId = await getOwnedBusinessId(ownerId);
  const application = await prisma.platformApiApplication.findFirst({
    where: { id: input.applicationId, businessId },
  });
  if (!application) return null;

  const rawKey = generateApiKeyValue();
  const key = await prisma.platformApiKey.create({
    data: {
      applicationId: input.applicationId,
      businessId,
      name: input.name.trim(),
      hashedKey: hashApiKey(rawKey),
      permissions: (input.permissions ?? []) as Prisma.InputJsonValue,
      expiresAt: input.expiresAt,
      status: "ACTIVE",
    },
  });

  return {
    id: key.id,
    name: key.name,
    rawKey,
    maskedKey: maskSecret(rawKey),
    expiresAt: key.expiresAt,
  };
}

export async function revokeApiKey(ownerId: string, keyId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformApiKey.findFirst({
    where: { id: keyId, businessId },
  });
  if (!existing) return null;

  return prisma.platformApiKey.update({
    where: { id: keyId },
    data: { status: "REVOKED" },
  });
}

export async function rotateApiKey(ownerId: string, keyId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformApiKey.findFirst({
    where: { id: keyId, businessId, status: "ACTIVE" },
  });
  if (!existing) return null;

  await revokeApiKey(ownerId, keyId);
  return createApiKey(ownerId, {
    applicationId: existing.applicationId,
    name: `${existing.name} (rotated)`,
    permissions: Array.isArray(existing.permissions) ? (existing.permissions as string[]) : [],
    expiresAt: existing.expiresAt ?? undefined,
  });
}

export async function validateApiKey(rawKey: string) {
  const hashed = hashApiKey(rawKey);
  const key = await prisma.platformApiKey.findFirst({
    where: { hashedKey: hashed, status: "ACTIVE" },
    include: { application: true },
  });
  if (!key) return null;
  if (key.expiresAt && key.expiresAt.getTime() < Date.now()) {
    await prisma.platformApiKey.update({ where: { id: key.id }, data: { status: "EXPIRED" } });
    return null;
  }

  await prisma.platformApiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });

  return key;
}

export async function updateApiKeyStatus(
  ownerId: string,
  keyId: string,
  status: PlatformApiStatus,
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformApiKey.findFirst({
    where: { id: keyId, businessId },
  });
  if (!existing) return null;

  return prisma.platformApiKey.update({ where: { id: keyId }, data: { status } });
}
