import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/app-marketplace-context.service";
import { writeAppMarketplaceAuditLog } from "@/services/app-marketplace-audit-logger.service";

export async function getAppConfiguration(ownerId: string, installedAppId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const installed = await prisma.platformInstalledApp.findFirst({
    where: { id: installedAppId, businessId },
    select: { id: true, configuration: true, appId: true },
  });
  return installed;
}

export async function updateAppConfiguration(
  ownerId: string,
  installedAppId: string,
  configuration: Record<string, unknown>,
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformInstalledApp.findFirst({
    where: { id: installedAppId, businessId },
    include: { app: true },
  });
  if (!existing) return null;

  const updated = await prisma.platformInstalledApp.update({
    where: { id: installedAppId },
    data: { configuration: configuration as Prisma.InputJsonValue },
    include: { app: true },
  });

  await writeAppMarketplaceAuditLog(businessId, {
    action: "app.configured",
    entityId: installedAppId,
    message: `Configuration updated for ${existing.app.name}`,
  });

  return updated;
}

export async function mergeAppConfiguration(
  ownerId: string,
  installedAppId: string,
  patch: Record<string, unknown>,
) {
  const current = await getAppConfiguration(ownerId, installedAppId);
  if (!current) return null;
  const base =
    current.configuration && typeof current.configuration === "object"
      ? (current.configuration as Record<string, unknown>)
      : {};
  return updateAppConfiguration(ownerId, installedAppId, { ...base, ...patch });
}
