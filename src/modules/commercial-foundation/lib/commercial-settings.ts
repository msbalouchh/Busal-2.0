import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  BillingInvoice,
  BillingPayment,
} from "@/modules/billing/types/billing-platform";

export interface StoredCommercialOperations {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  trialEndsAt: string | null;
  invoices: BillingInvoice[];
  payments: BillingPayment[];
  couponsApplied: string[];
  lastCheckoutSessionId: string | null;
}

export function defaultCommercialOperations(): StoredCommercialOperations {
  return {
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripePriceId: null,
    trialEndsAt: null,
    invoices: [],
    payments: [],
    couponsApplied: [],
    lastCheckoutSessionId: null,
  };
}

export async function loadCommercialOperations(businessId: string): Promise<StoredCommercialOperations> {
  const settings = await prisma.tenantSettings.findUnique({
    where: { businessId },
    select: { customSettings: true },
  });

  const raw = settings?.customSettings;
  if (raw && typeof raw === "object" && raw !== null && "commercialOperations" in raw) {
    return {
      ...defaultCommercialOperations(),
      ...(raw as unknown as { commercialOperations: StoredCommercialOperations }).commercialOperations,
    };
  }

  return defaultCommercialOperations();
}

export async function saveCommercialOperations(
  businessId: string,
  operations: StoredCommercialOperations,
): Promise<void> {
  const existing = await prisma.tenantSettings.findUnique({
    where: { businessId },
    select: { customSettings: true },
  });

  const settingsObject =
    existing?.customSettings && typeof existing.customSettings === "object" && existing.customSettings !== null
      ? (existing.customSettings as Record<string, unknown>)
      : {};

  await prisma.tenantSettings.upsert({
    where: { businessId },
    create: {
      businessId,
      customSettings: { ...settingsObject, commercialOperations: operations } as unknown as Prisma.InputJsonValue,
    },
    update: {
      customSettings: { ...settingsObject, commercialOperations: operations } as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function mergeCommercialOperations(
  businessId: string,
  patch: Partial<StoredCommercialOperations>,
): Promise<StoredCommercialOperations> {
  const current = await loadCommercialOperations(businessId);
  const merged = { ...current, ...patch };
  await saveCommercialOperations(businessId, merged);
  return merged;
}

