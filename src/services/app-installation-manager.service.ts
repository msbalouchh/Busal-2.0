import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/app-marketplace-context.service";
import { checkAppCompatibility } from "@/services/app-compatibility-checker.service";
import { writeAppMarketplaceAuditLog } from "@/services/app-marketplace-audit-logger.service";

export async function listInstalledApps(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformInstalledApp.findMany({
    where: { businessId },
    include: { app: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getInstalledApp(ownerId: string, installedAppId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformInstalledApp.findFirst({
    where: { id: installedAppId, businessId },
    include: { app: { include: { versions: true } } },
  });
}

export async function installApp(ownerId: string, appId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const app = await prisma.platformMarketplaceApp.findFirst({
    where: { id: appId, status: "PUBLISHED" },
  });
  if (!app) return null;

  const compatibility = await checkAppCompatibility(ownerId, app.id);
  if (!compatibility.compatible) {
    return prisma.platformInstalledApp.create({
      data: {
        businessId,
        appId,
        version: app.currentVersion,
        status: "FAILED",
        configuration: { error: compatibility.reason } as Prisma.InputJsonValue,
      },
      include: { app: true },
    });
  }

  const installed = await prisma.platformInstalledApp.upsert({
    where: { businessId_appId: { businessId, appId } },
    create: {
      businessId,
      appId,
      version: app.currentVersion,
      status: "INSTALLED",
    },
    update: {
      version: app.currentVersion,
      status: "INSTALLED",
      configuration: {},
    },
    include: { app: true },
  });

  await writeAppMarketplaceAuditLog(businessId, {
    action: "app.installed",
    entityId: installed.id,
    message: `Installed app: ${app.name}`,
  });

  return installed;
}

export async function uninstallApp(ownerId: string, installedAppId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformInstalledApp.findFirst({
    where: { id: installedAppId, businessId },
    include: { app: true },
  });
  if (!existing) return null;

  await prisma.platformInstalledApp.delete({ where: { id: installedAppId } });

  await writeAppMarketplaceAuditLog(businessId, {
    action: "app.uninstalled",
    entityId: installedAppId,
    message: `Uninstalled app: ${existing.app.name}`,
  });

  return existing;
}

export async function enableInstalledApp(ownerId: string, installedAppId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformInstalledApp.updateMany({
    where: { id: installedAppId, businessId },
    data: { status: "INSTALLED" },
  });
}

export async function disableInstalledApp(ownerId: string, installedAppId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformInstalledApp.updateMany({
    where: { id: installedAppId, businessId },
    data: { status: "DISABLED" },
  });
}

export async function getInstalledAppsSummary(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const [installed, disabled, pending, failed] = await Promise.all([
    prisma.platformInstalledApp.count({ where: { businessId, status: "INSTALLED" } }),
    prisma.platformInstalledApp.count({ where: { businessId, status: "DISABLED" } }),
    prisma.platformInstalledApp.count({ where: { businessId, status: "PENDING" } }),
    prisma.platformInstalledApp.count({ where: { businessId, status: "FAILED" } }),
  ]);
  return { installed, disabled, pending, failed, total: installed + disabled + pending + failed };
}
