import type {
  PlatformCommunicationCampaign,
  PlatformCommunicationChannel,
  PlatformCommunicationMessage,
  PlatformCommunicationTemplate,
} from "@prisma/client";

import type {
  CommunicationAnalyticsRecord,
  CommunicationCampaignRecord,
  CommunicationChannelRecord,
  CommunicationMessageRecord,
  CommunicationTemplateRecord,
} from "@/modules/communication-platform-management/types/communication-platform-types";

export function serializeCommunicationChannel(
  channel: PlatformCommunicationChannel,
): CommunicationChannelRecord {
  return {
    id: channel.id,
    name: channel.name,
    type: channel.type,
    status: channel.status,
    createdAt: channel.createdAt.toISOString(),
    updatedAt: channel.updatedAt.toISOString(),
  };
}

export function serializeCommunicationTemplate(
  template: PlatformCommunicationTemplate,
): CommunicationTemplateRecord {
  return {
    id: template.id,
    name: template.name,
    slug: template.slug,
    channel: template.channel,
    subject: template.subject,
    content: template.content,
    status: template.status,
    createdAt: template.createdAt.toISOString(),
  };
}

export function serializeCommunicationMessage(
  message: PlatformCommunicationMessage,
): CommunicationMessageRecord {
  return {
    id: message.id,
    channel: message.channel,
    recipient: message.recipient,
    subject: message.subject,
    content: message.content,
    status: message.status,
    direction: message.direction,
    providerReference: message.providerReference,
    sentAt: message.sentAt?.toISOString() ?? null,
    createdAt: message.createdAt.toISOString(),
  };
}

export function serializeCommunicationCampaign(
  campaign: PlatformCommunicationCampaign,
): CommunicationCampaignRecord {
  return {
    id: campaign.id,
    name: campaign.name,
    channel: campaign.channel,
    status: campaign.status,
    scheduledAt: campaign.scheduledAt?.toISOString() ?? null,
    completedAt: campaign.completedAt?.toISOString() ?? null,
    createdAt: campaign.createdAt.toISOString(),
  };
}

export function serializeCommunicationAnalytics(
  analytics: CommunicationAnalyticsRecord,
): CommunicationAnalyticsRecord {
  return analytics;
}

export function validateTemplateSlug(slug: string): string {
  const trimmed = slug.trim().toLowerCase().replace(/\s+/g, "-");
  if (!trimmed) throw new Error("Template slug is required");
  return trimmed;
}

export function validateRecipient(recipient: string): string {
  const trimmed = recipient.trim();
  if (!trimmed) throw new Error("Recipient is required");
  return trimmed;
}
