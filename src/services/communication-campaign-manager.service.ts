import "server-only";

import type { PlatformCampaignStatus, PlatformChannelType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/communication-platform-context.service";
import { sendCommunicationMessage } from "@/services/communication-message.service";

async function resolveCampaignRecipients(
  businessId: string,
  configuredRecipients: string[],
): Promise<string[]> {
  const normalized = configuredRecipients.map((entry) => entry.trim()).filter(Boolean);
  if (normalized.length > 0) {
    return normalized;
  }

  const customers = await prisma.customer.findMany({
    where: {
      businessId,
      deletedAt: null,
      marketingConsent: true,
      email: { not: null },
    },
    select: { email: true },
    take: 500,
  });

  return customers
    .map((customer) => customer.email?.trim().toLowerCase())
    .filter((email): email is string => Boolean(email));
}

export async function listCommunicationCampaigns(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformCommunicationCampaign.findMany({
    where: { businessId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createCommunicationCampaign(
  ownerId: string,
  input: {
    name: string;
    channel: PlatformChannelType;
    scheduledAt?: Date;
    configuration?: Record<string, unknown>;
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformCommunicationCampaign.create({
    data: {
      businessId,
      name: input.name,
      channel: input.channel,
      status: input.scheduledAt ? "SCHEDULED" : "DRAFT",
      scheduledAt: input.scheduledAt,
      configuration: (input.configuration ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function updateCommunicationCampaign(
  ownerId: string,
  campaignId: string,
  input: {
    name?: string;
    status?: PlatformCampaignStatus;
    scheduledAt?: Date | null;
    configuration?: Record<string, unknown>;
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformCommunicationCampaign.findFirst({
    where: { id: campaignId, businessId },
  });
  if (!existing) return null;

  return prisma.platformCommunicationCampaign.update({
    where: { id: campaignId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.scheduledAt !== undefined ? { scheduledAt: input.scheduledAt } : {}),
      ...(input.configuration !== undefined
        ? { configuration: input.configuration as Prisma.InputJsonValue }
        : {}),
    },
  });
}

export async function deleteCommunicationCampaign(ownerId: string, campaignId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformCommunicationCampaign.findFirst({
    where: { id: campaignId, businessId },
  });
  if (!existing) return false;
  await prisma.platformCommunicationCampaign.delete({ where: { id: campaignId } });
  return true;
}

export async function executeCommunicationCampaign(ownerId: string, campaignId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const campaign = await prisma.platformCommunicationCampaign.findFirst({
    where: { id: campaignId, businessId },
  });
  if (!campaign) throw new Error("Campaign not found");

  await prisma.platformCommunicationCampaign.update({
    where: { id: campaignId },
    data: { status: "RUNNING" },
  });

  const config = campaign.configuration as Record<string, unknown>;
  const recipients = await resolveCampaignRecipients(
    businessId,
    Array.isArray(config.recipients) ? (config.recipients as string[]) : [],
  );
  if (recipients.length === 0) {
    throw new Error(
      "No marketing recipients found. Add recipients or opt-in customers with email.",
    );
  }
  const content = String(config.content ?? "").trim();
  if (!content) {
    throw new Error("Campaign content is required before execution.");
  }
  const subject = String(config.subject ?? campaign.name);

  for (const recipient of recipients) {
    await sendCommunicationMessage(ownerId, {
      channel: campaign.channel,
      recipient,
      subject,
      content,
      metadata: { campaignId: campaign.id },
    });
  }

  return prisma.platformCommunicationCampaign.update({
    where: { id: campaignId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
}
