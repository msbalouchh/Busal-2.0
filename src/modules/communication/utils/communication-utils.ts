import type {
  CommunicationActivityLog,
  CommunicationAuditLog,
  CommunicationChannelConnector,
  CommunicationConversation,
  CommunicationMessage,
} from "@prisma/client";

import type { CommunicationDashboardMetrics } from "@/modules/communication/types/communication-types";

import type { TimelineMessage } from "@/modules/communication/types/communication-types";

export interface CommunicationDashboardView {
  totalConversations: number;
  openConversations: number;
  waitingStaff: number;
  aiHandled: number;
  unreadMessages: number;
  channelsConfigured: number;
}

export interface CommunicationConversationView {
  id: string;
  subject: string | null;
  status: string;
  priority: string;
  sourceChannel: string;
  inboxType: string;
  tags: string[];
  assignedStaffId: string | null;
  assignedAiAgentId: string | null;
  lastMessageAt: string;
}

export interface CommunicationMessageView {
  id: string;
  messageType: string;
  senderType: string;
  channel: string;
  body: string;
  deliveryStatus: string;
  isInternal: boolean;
  createdAt: string;
  mentions: string[];
}

export interface CommunicationChannelView {
  id: string;
  channel: string;
  name: string;
  isEnabled: boolean;
}

export interface CommunicationAuditView {
  id: string;
  eventType: string;
  createdAt: string;
}

export interface CommunicationActivityView {
  id: string;
  eventType: string;
  description: string | null;
  createdAt: string;
}

export function serializeCommunicationDashboard(
  metrics: CommunicationDashboardMetrics,
): CommunicationDashboardView {
  return { ...metrics };
}

export function serializeConversation(
  conversation: CommunicationConversation,
): CommunicationConversationView {
  return {
    id: conversation.id,
    subject: conversation.subject,
    status: conversation.status,
    priority: conversation.priority,
    sourceChannel: conversation.sourceChannel,
    inboxType: conversation.inboxType,
    tags: conversation.tags,
    assignedStaffId: conversation.assignedStaffId,
    assignedAiAgentId: conversation.assignedAiAgentId,
    lastMessageAt: conversation.lastMessageAt.toISOString(),
  };
}

export function serializeTimelineMessage(message: TimelineMessage): CommunicationMessageView {
  return {
    id: message.id,
    messageType: message.messageType,
    senderType: message.senderType,
    channel: message.channel,
    body: message.body,
    deliveryStatus: message.deliveryStatus,
    isInternal: message.isInternal,
    createdAt: message.createdAt.toISOString(),
    mentions: [],
  };
}

export function serializeMessage(message: CommunicationMessage): CommunicationMessageView {
  return {
    id: message.id,
    messageType: message.messageType,
    senderType: message.senderType,
    channel: message.channel,
    body: message.body,
    deliveryStatus: message.deliveryStatus,
    isInternal: message.isInternal,
    createdAt: message.createdAt.toISOString(),
    mentions: message.mentions,
  };
}

export function serializeChannelConnector(
  connector: CommunicationChannelConnector,
): CommunicationChannelView {
  return {
    id: connector.id,
    channel: connector.channel,
    name: connector.name,
    isEnabled: connector.isEnabled,
  };
}

export function serializeAuditLog(log: CommunicationAuditLog): CommunicationAuditView {
  return {
    id: log.id,
    eventType: log.eventType,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeActivityLog(log: CommunicationActivityLog): CommunicationActivityView {
  return {
    id: log.id,
    eventType: log.eventType,
    description: log.description,
    createdAt: log.createdAt.toISOString(),
  };
}
