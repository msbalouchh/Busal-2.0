import type { CustomerAiChannelProvider, CustomerAiChannelConnectionStatus } from "@prisma/client";

import type { CustomerAiChannel } from "@/modules/customer-ai/types/customer-ai.types";

export interface ChannelAttachment {
  id: string;
  type: "image" | "file" | "audio" | "video" | "link" | "unknown";
  url?: string;
  mimeType?: string;
  fileName?: string;
  caption?: string;
}

export interface ChannelReplyContext {
  externalMessageId?: string;
  quotedText?: string;
}

/** Normalized inbound message from any channel adapter. */
export interface OmnichannelInboundMessage {
  businessId: string;
  channel: CustomerAiChannel;
  externalAccountId: string;
  externalConversationId: string;
  externalMessageId: string;
  customerIdentifier: string;
  customerDisplayName: string | null;
  messageText: string;
  attachments: ChannelAttachment[];
  timestamp: Date;
  replyContext?: ChannelReplyContext;
  channelMetadata: Record<string, unknown>;
}

/** Normalized outbound message to any channel adapter. */
export interface OmnichannelOutboundMessage {
  businessId: string;
  channel: CustomerAiChannel;
  externalAccountId: string;
  externalConversationId: string;
  externalCustomerId: string;
  content: string;
  aiName: string;
  aiAvatarUrl: string | null;
  attachments?: ChannelAttachment[];
  quickReplies?: string[];
  buttons?: Array<{ id: string; label: string; url?: string }>;
  metadata?: Record<string, unknown>;
}

export interface ChannelConnectionCredentials {
  provider: CustomerAiChannelProvider;
  accessToken?: string;
  refreshToken?: string;
  appSecret?: string;
  pageId?: string;
  phoneNumberId?: string;
  accountSid?: string;
  authToken?: string;
  whatsappFrom?: string;
  verifyToken?: string;
  webhookSecret?: string;
  [key: string]: string | undefined;
}

export interface ChannelConnectionSummary {
  id: string;
  businessId: string;
  channel: CustomerAiChannel;
  provider: CustomerAiChannelProvider;
  externalAccountId: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: CustomerAiChannelConnectionStatus;
  webhookVerified: boolean;
  aiEnabled: boolean;
  tokenExpiresAt: string | null;
  lastHealthCheckAt: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelConnectionHealth {
  healthy: boolean;
  status: CustomerAiChannelConnectionStatus;
  message: string;
  checkedAt: string;
}

export interface InboundProcessingResult {
  processed: boolean;
  duplicate: boolean;
  skippedReason?: string;
  aiResponseSent: boolean;
  conversationId?: string;
  externalThreadId?: string;
  escalated?: boolean;
}

export interface OutboundDeliveryResult {
  success: boolean;
  externalMessageId?: string;
  error?: string;
  providerResponse?: Record<string, unknown>;
}

export interface ChannelAiSettings {
  aiEnabled: boolean;
  greetingBehavior: "always" | "first_message" | "never";
  humanEscalationEnabled: boolean;
  autoEscalateOnFailure: boolean;
  outsideHoursBehavior: "normal" | "collect_request" | "hours_only" | "escalate";
  allowedCapabilities: string[];
  channelMetadata: Record<string, unknown>;
}

export type ChannelWebhookVerifyResult =
  | { type: "challenge"; response: string }
  | { type: "accepted"; connectionId: string }
  | { type: "rejected"; reason: string };
