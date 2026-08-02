import type {
  PlatformCampaignStatus,
  PlatformChannelStatus,
  PlatformChannelType,
  PlatformMessageDirection,
  PlatformMessageStatus,
  PlatformTemplateStatus,
} from "@prisma/client";

export interface CommunicationChannelRecord {
  id: string;
  name: string;
  type: PlatformChannelType;
  status: PlatformChannelStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationTemplateRecord {
  id: string;
  name: string;
  slug: string;
  channel: PlatformChannelType;
  subject: string;
  content: string;
  status: PlatformTemplateStatus;
  createdAt: string;
}

export interface CommunicationMessageRecord {
  id: string;
  channel: PlatformChannelType;
  recipient: string;
  subject: string;
  content: string;
  status: PlatformMessageStatus;
  direction: PlatformMessageDirection;
  providerReference: string;
  sentAt: string | null;
  createdAt: string;
}

export interface CommunicationCampaignRecord {
  id: string;
  name: string;
  channel: PlatformChannelType;
  status: PlatformCampaignStatus;
  scheduledAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface CommunicationAnalyticsRecord {
  totalMessages: number;
  sent: number;
  delivered: number;
  failed: number;
  queued: number;
  deliveryRate: number;
  campaigns: number;
  templates: number;
  channels: number;
}

export interface CommunicationProviderRecord {
  id: string;
  name: string;
  channelType: PlatformChannelType;
  available: boolean;
  simulated: boolean;
}
