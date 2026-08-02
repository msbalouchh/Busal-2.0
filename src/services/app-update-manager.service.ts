import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/app-marketplace-context.service";
import { writeAppMarketplaceAuditLog } from "@/services/app-marketplace-audit-logger.service";

export async function listAvailableUpdates(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const installed = await prisma.platformInstalledApp.findMany({
    where: { businessId, status: { in: ["INSTALLED", "DISABLED"] } },
    include: { app: true },
  });

  return installed.filter((entry) => entry.version !== entry.app.currentVersion);
}

export async function updateInstalledApp(ownerId: string, installedAppId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const installed = await prisma.platformInstalledApp.findFirst({
    where: { id: installedAppId, businessId },
    include: { app: true },
  });
  if (!installed) return null;

  const updated = await prisma.platformInstalledApp.update({
    where: { id: installedAppId },
    data: {
      version: installed.app.currentVersion,
      configuration: {
        ...(typeof installed.configuration === "object" && installed.configuration
          ? (installed.configuration as Record<string, unknown>)
          : {}),
        previousVersion: installed.version,
      } as Prisma.InputJsonValue,
    },
    include: { app: true },
  });

  await writeAppMarketplaceAuditLog(businessId, {
    action: "app.updated",
    entityId: installedAppId,
    message: `Updated ${installed.app.name} to ${installed.app.currentVersion}`,
  });

  return updated;
}

export async function rollbackInstalledApp(ownerId: string, installedAppId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const installed = await prisma.platformInstalledApp.findFirst({
    where: { id: installedAppId, businessId },
    include: { app: { include: { versions: { orderBy: { publishedAt: "desc" } } } } },
  });
  if (!installed) return null;

  const config =
    typeof installed.configuration === "object" && installed.configuration
      ? (installed.configuration as Record<string, unknown>)
      : {};
  const previousVersion =
    typeof config.previousVersion === "string"
      ? config.previousVersion
      : installed.app.versions[1]?.version;

  if (!previousVersion) return null;

  const rolled = await prisma.platformInstalledApp.update({
    where: { id: installedAppId },
    data: { version: previousVersion },
    include: { app: true },
  });

  await writeAppMarketplaceAuditLog(businessId, {
    action: "app.rollback",
    entityId: installedAppId,
    message: `Rolled back ${installed.app.name} to ${previousVersion}`,
  });

  return rolled;
}
