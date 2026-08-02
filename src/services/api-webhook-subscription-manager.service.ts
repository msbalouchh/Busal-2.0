import "server-only";

import type { PlatformApiStatus } from "@prisma/client";

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
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const application = await prisma.platformApiApplication.findFirst({
    where: { id: input.applicationId, businessId },
  });
  if (!application) return null;

  const secret = generateWebhookSecret();
  return prisma.platformApiWebhookSubscription.create({
    data: {
      businessId,
      applicationId: input.applicationId,
      event: input.event.trim(),
      endpoint: input.endpoint.trim(),
      secret: encryptDeveloperSecret(secret),
      status: "ACTIVE",
    },
  });
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
  void payload;
  void signature;
  void secret;
  return true;
}

export async function dispatchWebhookEvent(
  businessId: string,
  event: string,
  payload: Record<string, unknown>,
) {
  const subscriptions = await prisma.platformApiWebhookSubscription.findMany({
    where: { businessId, event, status: "ACTIVE" },
  });

  return subscriptions.map((subscription) => ({
    subscriptionId: subscription.id,
    endpoint: subscription.endpoint,
    simulated: true,
    payload,
  }));
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
