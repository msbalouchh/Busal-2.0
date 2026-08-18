import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface StoredWebhookDelivery {
  id: string;
  subscriptionId: string;
  event: string;
  endpoint: string;
  status: "delivered" | "failed" | "pending" | "retrying";
  statusCode: number | null;
  attemptCount: number;
  errorMessage: string | null;
  deliveryId: string;
  createdAt: string;
  nextRetryAt: string | null;
  payloadData?: Record<string, unknown>;
}

const LOG_KEY = "webhookDeliveryLog";
const MAX_ENTRIES = 200;

function readDeliveryLog(customSettings: unknown): StoredWebhookDelivery[] {
  if (!customSettings || typeof customSettings !== "object" || customSettings === null) {
    return [];
  }

  const entries = (customSettings as Record<string, unknown>)[LOG_KEY];
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries as StoredWebhookDelivery[];
}

async function writeDeliveryLog(
  businessId: string,
  entries: StoredWebhookDelivery[],
): Promise<void> {
  const settings = await prisma.tenantSettings.findUnique({
    where: { businessId },
    select: { customSettings: true },
  });

  const settingsObject =
    settings?.customSettings &&
    typeof settings.customSettings === "object" &&
    settings.customSettings !== null
      ? (settings.customSettings as Record<string, unknown>)
      : {};

  await prisma.tenantSettings.upsert({
    where: { businessId },
    create: {
      businessId,
      customSettings: { ...settingsObject, [LOG_KEY]: entries } as unknown as Prisma.InputJsonValue,
    },
    update: {
      customSettings: { ...settingsObject, [LOG_KEY]: entries } as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function appendWebhookDeliveryLog(
  businessId: string,
  entry: StoredWebhookDelivery,
): Promise<void> {
  const settings = await prisma.tenantSettings.findUnique({
    where: { businessId },
    select: { customSettings: true },
  });

  const existing = readDeliveryLog(settings?.customSettings);
  const merged = [entry, ...existing].slice(0, MAX_ENTRIES);
  await writeDeliveryLog(businessId, merged);
}

export async function updateWebhookDeliveryLogEntry(
  businessId: string,
  entryId: string,
  patch: Partial<StoredWebhookDelivery>,
): Promise<StoredWebhookDelivery | null> {
  const settings = await prisma.tenantSettings.findUnique({
    where: { businessId },
    select: { customSettings: true },
  });

  const existing = readDeliveryLog(settings?.customSettings);
  const index = existing.findIndex((entry) => entry.id === entryId);
  if (index < 0) {
    return null;
  }

  const current = existing[index]!;
  const updated = { ...current, ...patch, id: current.id } satisfies StoredWebhookDelivery;
  existing[index] = updated;
  await writeDeliveryLog(businessId, existing);
  return updated;
}

export async function listWebhookDeliveryLog(
  businessId: string,
  limit = 50,
): Promise<StoredWebhookDelivery[]> {
  const settings = await prisma.tenantSettings.findUnique({
    where: { businessId },
    select: { customSettings: true },
  });

  return readDeliveryLog(settings?.customSettings).slice(0, limit);
}

export async function getWebhookDeliveryById(
  businessId: string,
  deliveryId: string,
): Promise<StoredWebhookDelivery | null> {
  const entries = await listWebhookDeliveryLog(businessId, MAX_ENTRIES);
  return entries.find((entry) => entry.deliveryId === deliveryId) ?? null;
}

export async function listDueWebhookRetries(
  limit = 100,
): Promise<Array<{ businessId: string; entry: StoredWebhookDelivery }>> {
  const settingsRows = await prisma.tenantSettings.findMany({
    select: { businessId: true, customSettings: true },
  });

  const now = Date.now();
  const due: Array<{ businessId: string; entry: StoredWebhookDelivery }> = [];

  for (const row of settingsRows) {
    for (const entry of readDeliveryLog(row.customSettings)) {
      if (entry.status !== "retrying" || !entry.nextRetryAt) {
        continue;
      }

      if (new Date(entry.nextRetryAt).getTime() > now) {
        continue;
      }

      due.push({ businessId: row.businessId, entry });
      if (due.length >= limit) {
        return due;
      }
    }
  }

  return due;
}
