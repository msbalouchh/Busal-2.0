import "server-only";

import type { PlatformApiStatus, PlatformApiVersion } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  encryptDeveloperSecret,
  generateClientId,
  generateClientSecret,
  getOwnedBusinessId,
  maskSecret,
} from "@/services/developer-platform-context.service";

export async function listApiApplications(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformApiApplication.findMany({
    where: { businessId },
    include: { _count: { select: { apiKeys: true, webhooks: true, requestLogs: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getApiApplication(ownerId: string, applicationId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformApiApplication.findFirst({
    where: { id: applicationId, businessId },
    include: {
      apiKeys: { orderBy: { createdAt: "desc" } },
      webhooks: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function createApiApplication(
  ownerId: string,
  input: { name: string; description?: string; apiVersion?: PlatformApiVersion },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const clientId = generateClientId();
  const clientSecret = generateClientSecret();

  return prisma.platformApiApplication.create({
    data: {
      businessId,
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      clientId,
      clientSecret: encryptDeveloperSecret(clientSecret),
      apiVersion: input.apiVersion ?? "V1",
      createdBy: ownerId,
    },
  });
}

export async function updateApiApplication(
  ownerId: string,
  applicationId: string,
  input: {
    name?: string;
    description?: string;
    status?: PlatformApiStatus;
    apiVersion?: PlatformApiVersion;
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformApiApplication.findFirst({
    where: { id: applicationId, businessId },
  });
  if (!existing) return null;

  return prisma.platformApiApplication.update({
    where: { id: applicationId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.apiVersion !== undefined ? { apiVersion: input.apiVersion } : {}),
    },
  });
}

export async function deleteApiApplication(ownerId: string, applicationId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformApiApplication.findFirst({
    where: { id: applicationId, businessId },
  });
  if (!existing) return null;

  await prisma.platformApiApplication.delete({ where: { id: applicationId } });
  return existing;
}

export async function getDeveloperDashboardSummary(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const [applications, keys, webhooks, logs, usage] = await Promise.all([
    prisma.platformApiApplication.count({ where: { businessId } }),
    prisma.platformApiKey.count({ where: { businessId, status: "ACTIVE" } }),
    prisma.platformApiWebhookSubscription.count({ where: { businessId, status: "ACTIVE" } }),
    prisma.platformApiRequestLog.count({
      where: { businessId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    prisma.platformApiRequestLog.groupBy({
      by: ["statusCode"],
      where: { businessId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      _count: { id: true },
    }),
  ]);

  return {
    applications,
    activeKeys: keys,
    webhooks,
    requests24h: logs,
    usageByStatus: usage.map((row) => ({
      statusCode: row.statusCode,
      count: row._count.id,
    })),
  };
}

export function serializeApplicationClientSecret(_encrypted: string): string {
  return maskSecret("secret");
}

export async function rotateApplicationSecret(ownerId: string, applicationId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformApiApplication.findFirst({
    where: { id: applicationId, businessId },
  });
  if (!existing) return null;

  const clientSecret = generateClientSecret();
  await prisma.platformApiApplication.update({
    where: { id: applicationId },
    data: { clientSecret: encryptDeveloperSecret(clientSecret) },
  });

  return { clientSecret };
}

export async function getDeveloperSettings(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return getDeveloperSettingsByBusinessId(businessId);
}

export async function getDeveloperSettingsByBusinessId(businessId: string) {
  const settingsApp = await prisma.platformApiApplication.findFirst({
    where: { businessId, name: "__developer_settings__" },
  });
  if (!settingsApp) {
    return {
      rateLimitPerMinute: 120,
      ipAllowList: [] as string[],
      defaultApiVersion: "V1" as PlatformApiVersion,
    };
  }

  try {
    const parsed = JSON.parse(settingsApp.description) as {
      rateLimitPerMinute?: number;
      ipAllowList?: string[];
      defaultApiVersion?: PlatformApiVersion;
    };
    return {
      rateLimitPerMinute: parsed.rateLimitPerMinute ?? 120,
      ipAllowList: parsed.ipAllowList ?? [],
      defaultApiVersion: parsed.defaultApiVersion ?? "V1",
    };
  } catch {
    return {
      rateLimitPerMinute: 120,
      ipAllowList: [],
      defaultApiVersion: "V1" as PlatformApiVersion,
    };
  }
}

export async function updateDeveloperSettings(
  ownerId: string,
  settings: {
    rateLimitPerMinute?: number;
    ipAllowList?: string[];
    defaultApiVersion?: PlatformApiVersion;
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const current = await getDeveloperSettings(ownerId);
  const merged = { ...current, ...settings };

  await prisma.platformApiApplication.upsert({
    where: { clientId: `settings_${businessId}` },
    create: {
      businessId,
      name: "__developer_settings__",
      description: JSON.stringify(merged),
      clientId: `settings_${businessId}`,
      clientSecret: encryptDeveloperSecret("settings"),
      status: "DISABLED",
      createdBy: ownerId,
    },
    update: { description: JSON.stringify(merged) },
  });

  return merged;
}

export type DeveloperSettings = Awaited<ReturnType<typeof getDeveloperSettings>>;

export async function searchApiApplications(ownerId: string, query: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const trimmed = query.trim();
  if (!trimmed) return [];

  return prisma.platformApiApplication.findMany({
    where: {
      businessId,
      name: { not: "__developer_settings__" },
      OR: [
        { name: { contains: trimmed, mode: "insensitive" } },
        { clientId: { contains: trimmed, mode: "insensitive" } },
        { description: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
}
