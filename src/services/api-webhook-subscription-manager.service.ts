import "server-only";

import type { PlatformApiStatus } from "@prisma/client";

import { deliverWebhookEvent as deliverPlatformWebhooks } from "@/modules/platform/services/platform-webhook-delivery.service";
import { verifyIncomingWebhookSignature as verifyPlatformWebhookSignature } from "@/modules/platform/services/platform-webhook-delivery.service";
import { loadPlatformConsumptionConfig } from "@/modules/platform/lib/platform-settings";
import { resolvePlatformEntitlements } from "@/modules/platform/services/platform-entitlements.service";
import { prisma } from "@/lib/prisma";
import {
  encryptDeveloperSecret,
  generateWebhookSecret,
  getOwnedBusinessId,
} from "@/services/developer-platform-context.service";

export async function listWebhookSubscriptions(ownerId: string, applicationId?: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformApiWebhookSubscription.findMany({
    where: {
      businessId,
      ...(applicationId ? { applicationId } : {}),
    },
    include: { application: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createWebhookSubscription(
  ownerId: string,
  input: { applicationId: string; event: string; endpoint: string },
): Promise<{ subscription: Awaited<ReturnType<typeof prisma.platformApiWebhookSubscription.create>>; secret: string } | null> {
  const businessId = await getOwnedBusinessId(ownerId);
  const application = await prisma.platformApiApplication.findFirst({
    where: { id: input.applicationId, businessId },
  });
  if (!application) return null;

  const tenant = await prisma.tenantRecord.findUnique({
    where: { businessId },
    select: { subscriptionPlan: true },
  });
  const entitlements = resolvePlatformEntitlements(tenant?.subscriptionPlan);
  if (!entitlements.webhooks) {
    throw new Error("Webhooks require Busal Pro or Enterprise.");
  }

  const config = await loadPlatformConsumptionConfig(businessId);
  if (!config.webhooks.enabled) {
    throw new Error("Webhooks are disabled for this tenant.");
  }

  const secret = generateWebhookSecret();
  const subscription = await prisma.platformApiWebhookSubscription.create({
    data: {
      businessId,
      applicationId: input.applicationId,
      event: input.event.trim(),
      endpoint: input.endpoint.trim(),
      secret: encryptDeveloperSecret(secret),
      status: "ACTIVE",
    },
  });

  return { subscription, secret };
}

export async function updateWebhookSubscriptionStatus(
  ownerId: string,
  subscriptionId: string,
  status: PlatformApiStatus,
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformApiWebhookSubscription.findFirst({
    where: { id: subscriptionId, businessId },
  });
  if (!existing) return null;

  return prisma.platformApiWebhookSubscription.update({
    where: { id: subscriptionId },
    data: { status },
  });
}

export async function deleteWebhookSubscription(ownerId: string, subscriptionId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformApiWebhookSubscription.findFirst({
    where: { id: subscriptionId, businessId },
  });
  if (!existing) return null;

  await prisma.platformApiWebhookSubscription.delete({ where: { id: subscriptionId } });
  return existing;
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  return verifyPlatformWebhookSignature(payload, signature, secret);
}

export async function dispatchWebhookEvent(
  businessId: string,
  event: string,
  payload: Record<string, unknown>,
) {
  return deliverPlatformWebhooks({ businessId, event, data: payload });
}

export async function searchWebhookSubscriptions(ownerId: string, query: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const trimmed = query.trim();
  if (!trimmed) return [];

  return prisma.platformApiWebhookSubscription.findMany({
    where: {
      businessId,
      OR: [
        { event: { contains: trimmed, mode: "insensitive" } },
        { endpoint: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    take: 20,
  });
}
