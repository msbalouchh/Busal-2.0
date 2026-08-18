import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { defaultPlatformConsumptionConfig } from "@/modules/platform/constants/platform-defaults";
import type { PlatformConsumptionConfig } from "@/modules/platform/types/platform-config.types";

const SETTINGS_KEY = "platformConsumption";

export async function loadPlatformConsumptionConfig(
  businessId: string,
): Promise<PlatformConsumptionConfig> {
  const settings = await prisma.tenantSettings.findUnique({
    where: { businessId },
    select: { customSettings: true },
  });

  const raw = settings?.customSettings;
  if (raw && typeof raw === "object" && raw !== null && SETTINGS_KEY in raw) {
    return {
      ...defaultPlatformConsumptionConfig(),
      ...(raw as Record<string, unknown>)[SETTINGS_KEY] as PlatformConsumptionConfig,
    };
  }

  return defaultPlatformConsumptionConfig();
}

export async function savePlatformConsumptionConfig(
  businessId: string,
  config: PlatformConsumptionConfig,
): Promise<void> {
  const existing = await prisma.tenantSettings.findUnique({
    where: { businessId },
    select: { customSettings: true },
  });

  const settingsObject =
    existing?.customSettings &&
    typeof existing.customSettings === "object" &&
    existing.customSettings !== null
      ? (existing.customSettings as Record<string, unknown>)
      : {};

  await prisma.tenantSettings.upsert({
    where: { businessId },
    create: {
      businessId,
      customSettings: {
        ...settingsObject,
        [SETTINGS_KEY]: config,
      } as unknown as Prisma.InputJsonValue,
    },
    update: {
      customSettings: {
        ...settingsObject,
        [SETTINGS_KEY]: config,
      } as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function mergePlatformConsumptionConfig(
  businessId: string,
  patch: Partial<PlatformConsumptionConfig>,
  updatedByUserId?: string,
): Promise<PlatformConsumptionConfig> {
  const current = await loadPlatformConsumptionConfig(businessId);
  const merged: PlatformConsumptionConfig = {
    ...current,
    ...patch,
    branding: { ...current.branding, ...patch.branding },
    domains: { ...current.domains, ...patch.domains },
    api: { ...current.api, ...patch.api },
    webhooks: { ...current.webhooks, ...patch.webhooks },
    embed: { ...current.embed, ...patch.embed },
    updatedAt: new Date().toISOString(),
    updatedByUserId: updatedByUserId ?? current.updatedByUserId,
  };

  await savePlatformConsumptionConfig(businessId, merged);
  return merged;
}
