import "server-only";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/integration-context.service";
import {
  generateWebhookSecret,
  hashWebhookSecret,
  verifyWebhookSignature,
} from "@/services/integration-webhook-crypto.service";

export { verifyWebhookSignature };

export async function listIntegrationWebhooks(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.integrationWebhook.findMany({
    where: { businessId },
    include: { provider: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createIntegrationWebhook(
  ownerId: string,
  input: {
    providerId: string;
    event: string;
    endpoint: string;
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const rawSecret = generateWebhookSecret();

  const webhook = await prisma.integrationWebhook.create({
    data: {
      businessId,
      providerId: input.providerId,
      event: input.event,
      endpoint: input.endpoint,
      secret: hashWebhookSecret(rawSecret),
      status: "ACTIVE",
    },
    include: { provider: { select: { name: true, slug: true } } },
  });

  return { webhook, rawSecret };
}

export async function deleteIntegrationWebhook(ownerId: string, webhookId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const result = await prisma.integrationWebhook.deleteMany({
    where: { id: webhookId, businessId },
  });
  if (result.count === 0) throw new Error("Webhook not found");
}

export async function updateIntegrationWebhookStatus(
  ownerId: string,
  webhookId: string,
  status: "ACTIVE" | "INACTIVE",
) {
  const businessId = await getOwnedBusinessId(ownerId);
  await prisma.integrationWebhook.updateMany({
    where: { id: webhookId, businessId },
    data: { status },
  });
}
