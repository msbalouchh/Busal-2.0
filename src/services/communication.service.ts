import "server-only";

import type {
  CommunicationAttachmentType,
  CommunicationAuditEventType,
  CommunicationChannel,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  evaluatePermission,
  toPermissionEvaluationContext,
} from "@/modules/iam/engine/permission-engine";
import { COMMUNICATION_CHANNELS } from "@/modules/communication/constants/routes";
import {
  canAutoSendMessage,
  generateAiInsight,
  shouldEscalateByConfidence,
} from "@/modules/communication/engine/ai-engine";
import {
  createPlatformFileReference,
  validateStorageKey,
} from "@/modules/communication/engine/attachment-engine";
import { mergeTimelineMessages } from "@/modules/communication/engine/conversation-engine";
import { buildConversationSearchWhere } from "@/modules/communication/engine/search-engine";
import { buildInboxWhereClause } from "@/modules/communication/engine/conversation-engine";
import { ensureBootstrapCommunication } from "@/modules/communication/plugins/bootstrap-communication";
import type {
  AddInternalNoteInput,
  AiInsightRequest,
  AssignConversationInput,
  CommunicationDashboardMetrics,
  CreateConversationInput,
  InboxFilterInput,
  SearchConversationsInput,
  SendMessageInput,
  TimelineMessage,
} from "@/modules/communication/types/communication-types";

function assertPermission(platform: BusinessContext, permission: string): void {
  const context = toPermissionEvaluationContext({
    permissions: platform.permissions,
    roleSlug: platform.roleSlug,
    isOwner: platform.isOwner,
    businessId: platform.business.id,
    branchId: platform.branchId,
  });

  if (!evaluatePermission(context, permission)) {
    throw new Error(`Permission denied: ${permission} required`);
  }
}

async function getStaffIdForPlatform(platform: BusinessContext): Promise<string | null> {
  const staff = await prisma.staff.findFirst({
    where: { businessId: platform.business.id, userId: platform.user.id },
  });
  return staff?.id ?? null;
}

async function logAuditEvent(input: {
  businessId: string;
  conversationId?: string | null;
  messageId?: string | null;
  eventType: CommunicationAuditEventType;
  staffId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.communicationAuditLog.create({
    data: {
      businessId: input.businessId,
      conversationId: input.conversationId ?? null,
      messageId: input.messageId ?? null,
      eventType: input.eventType,
      staffId: input.staffId ?? null,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

async function logActivity(input: {
  conversationId: string;
  businessId: string;
  staffId?: string | null;
  eventType: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.communicationActivityLog.create({
    data: {
      conversationId: input.conversationId,
      businessId: input.businessId,
      staffId: input.staffId ?? null,
      eventType: input.eventType,
      description: input.description ?? null,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

export async function ensureCommunicationDefaults(businessId: string): Promise<void> {
  ensureBootstrapCommunication();

  for (const channel of COMMUNICATION_CHANNELS) {
    const existing = await prisma.communicationChannelConnector.findFirst({
      where: { businessId, channel },
    });

    if (existing) {
      continue;
    }

    await prisma.communicationChannelConnector.create({
      data: {
        businessId,
        channel,
        name: channel.replace(/_/g, " "),
        isEnabled: false,
        config: { integrated: false },
      },
    });
  }
}

export async function createCommunicationContact(
  businessId: string,
  input: { name: string; email?: string | null; phone?: string | null; customerId?: string | null },
): Promise<{ id: string }> {
  const contact = await prisma.communicationContact.create({
    data: {
      businessId,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      customerId: input.customerId ?? null,
    },
  });

  return { id: contact.id };
}

export async function createConversation(
  platform: BusinessContext,
  input: CreateConversationInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.COMMUNICATION_MANAGE);

  let contactId = input.contactId ?? null;
  if (!contactId && input.contact) {
    const contact = await createCommunicationContact(platform.business.id, input.contact);
    contactId = contact.id;
  }

  const conversation = await prisma.communicationConversation.create({
    data: {
      businessId: platform.business.id,
      branchId: input.branchId ?? platform.branchId,
      customerId: input.customerId ?? input.contact?.customerId ?? null,
      contactId,
      sourceChannel: input.sourceChannel,
      subject: input.subject ?? null,
      priority: input.priority ?? "NORMAL",
      tags: input.tags ?? [],
      inboxType: input.inboxType ?? "TEAM",
      department: input.department ?? null,
      teamSlug: input.teamSlug ?? null,
    },
  });

  const staffId = await getStaffIdForPlatform(platform);

  await logAuditEvent({
    businessId: platform.business.id,
    conversationId: conversation.id,
    eventType: "CREATED",
    staffId,
    metadata: { sourceChannel: input.sourceChannel },
  });

  if (input.initialMessage) {
    await appendMessage(platform, {
      conversationId: conversation.id,
      body: input.initialMessage.body,
      channel: input.initialMessage.channel,
      messageType: "INBOUND",
      senderType: input.initialMessage.senderType,
      senderCustomerId: input.initialMessage.senderCustomerId,
      senderContactId: input.initialMessage.senderContactId ?? contactId,
      deliveryStatus: "DELIVERED",
    });
  }

  return { id: conversation.id };
}

async function appendMessage(
  platform: BusinessContext,
  input: {
    conversationId: string;
    body: string;
    channel: CommunicationChannel;
    messageType: "INBOUND" | "OUTBOUND" | "INTERNAL_NOTE" | "SYSTEM";
    senderType: "CUSTOMER" | "STAFF" | "AI_AGENT" | "SYSTEM" | "CONTACT";
    senderStaffId?: string | null;
    senderCustomerId?: string | null;
    senderContactId?: string | null;
    senderAiAgentId?: string | null;
    subject?: string | null;
    mentions?: string[];
    isInternal?: boolean;
    deliveryStatus?: "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED";
    attachments?: Array<{
      fileName: string;
      mimeType: string;
      storageKey: string;
      attachmentType: CommunicationAttachmentType;
      fileSizeBytes?: number;
    }>;
  },
): Promise<{ id: string }> {
  const now = new Date();
  const status = input.deliveryStatus ?? (input.isInternal ? "DELIVERED" : "QUEUED");

  const message = await prisma.communicationMessage.create({
    data: {
      conversationId: input.conversationId,
      businessId: platform.business.id,
      messageType: input.messageType,
      senderType: input.senderType,
      senderStaffId: input.senderStaffId ?? null,
      senderCustomerId: input.senderCustomerId ?? null,
      senderContactId: input.senderContactId ?? null,
      senderAiAgentId: input.senderAiAgentId ?? null,
      channel: input.channel,
      body: input.body,
      subject: input.subject ?? null,
      deliveryStatus: status,
      sentAt: status !== "QUEUED" ? now : null,
      deliveredAt: status === "DELIVERED" || status === "READ" ? now : null,
      isInternal: input.isInternal ?? false,
      mentions: input.mentions ?? [],
    },
  });

  if (input.attachments) {
    for (const attachment of input.attachments) {
      if (!validateStorageKey(attachment.storageKey)) {
        throw new Error("Invalid storage key");
      }

      await prisma.communicationMessageAttachment.create({
        data: {
          messageId: message.id,
          businessId: platform.business.id,
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          storageKey: attachment.storageKey,
          attachmentType: attachment.attachmentType,
          fileSizeBytes: attachment.fileSizeBytes ?? null,
        },
      });
    }

    await logAuditEvent({
      businessId: platform.business.id,
      conversationId: input.conversationId,
      messageId: message.id,
      eventType: "ATTACHMENT_ADDED",
      staffId: input.senderStaffId,
    });
  }

  const newStatus =
    input.messageType === "OUTBOUND"
      ? "WAITING_CUSTOMER"
      : input.messageType === "INBOUND"
        ? "WAITING_STAFF"
        : undefined;

  await prisma.communicationConversation.update({
    where: { id: input.conversationId },
    data: {
      lastMessageAt: now,
      ...(newStatus ? { status: newStatus } : {}),
    },
  });

  return { id: message.id };
}

export async function sendConversationReply(
  platform: BusinessContext,
  input: SendMessageInput,
): Promise<{ id: string; sent: boolean }> {
  assertPermission(platform, PERMISSION_CODES.COMMUNICATION_REPLY);

  const staffId = await getStaffIdForPlatform(platform);

  const attachments = input.attachments?.map((a) => createPlatformFileReference(a));

  const message = await appendMessage(platform, {
    conversationId: input.conversationId,
    body: input.body,
    channel: input.channel,
    messageType: input.messageType ?? "OUTBOUND",
    senderType: "STAFF",
    senderStaffId: staffId,
    subject: input.subject,
    mentions: input.mentions,
    deliveryStatus: canAutoSendMessage(input.autoSend ?? false, true) ? "SENT" : "QUEUED",
    attachments,
  });

  await logAuditEvent({
    businessId: platform.business.id,
    conversationId: input.conversationId,
    messageId: message.id,
    eventType: "REPLIED",
    staffId,
  });

  return { id: message.id, sent: input.autoSend ?? false };
}

export async function addInternalNote(
  platform: BusinessContext,
  input: AddInternalNoteInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.COMMUNICATION_REPLY);

  const staffId = await getStaffIdForPlatform(platform);
  const attachments = input.attachments?.map((a) => createPlatformFileReference(a));

  const message = await appendMessage(platform, {
    conversationId: input.conversationId,
    body: input.body,
    channel: "LIVE_CHAT",
    messageType: "INTERNAL_NOTE",
    senderType: "STAFF",
    senderStaffId: staffId,
    mentions: input.mentions,
    isInternal: true,
    deliveryStatus: "DELIVERED",
    attachments,
  });

  await logAuditEvent({
    businessId: platform.business.id,
    conversationId: input.conversationId,
    messageId: message.id,
    eventType: "NOTE_ADDED",
    staffId,
  });

  await logActivity({
    conversationId: input.conversationId,
    businessId: platform.business.id,
    staffId,
    eventType: "NOTE_ADDED",
    description: "Internal note added",
    metadata: { mentions: input.mentions ?? [] },
  });

  return { id: message.id };
}

export async function assignConversation(
  platform: BusinessContext,
  input: AssignConversationInput,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.COMMUNICATION_ASSIGN);

  const staffId = await getStaffIdForPlatform(platform);

  const existing = await prisma.communicationConversation.findFirst({
    where: { id: input.conversationId, businessId: platform.business.id },
  });

  if (!existing) {
    throw new Error("Conversation not found");
  }

  await prisma.communicationConversation.update({
    where: { id: input.conversationId },
    data: {
      assignedStaffId: input.assignedStaffId ?? null,
      assignedAiAgentId: input.assignedAiAgentId ?? null,
      department: input.department ?? existing.department,
      teamSlug: input.teamSlug ?? existing.teamSlug,
      inboxType: input.inboxType ?? existing.inboxType,
      status: input.assignedAiAgentId ? "AI_HANDLED" : existing.status,
    },
  });

  await logAuditEvent({
    businessId: platform.business.id,
    conversationId: input.conversationId,
    eventType: existing.assignedStaffId ? "REASSIGNED" : "ASSIGNED",
    staffId,
    metadata: {
      assignedStaffId: input.assignedStaffId,
      assignedAiAgentId: input.assignedAiAgentId,
    },
  });

  await logActivity({
    conversationId: input.conversationId,
    businessId: platform.business.id,
    staffId,
    eventType: "ASSIGNED",
    description: "Conversation assigned",
  });
}

export async function closeConversation(
  platform: BusinessContext,
  conversationId: string,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.COMMUNICATION_MANAGE);

  const staffId = await getStaffIdForPlatform(platform);

  await prisma.communicationConversation.updateMany({
    where: { id: conversationId, businessId: platform.business.id },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  await logAuditEvent({
    businessId: platform.business.id,
    conversationId,
    eventType: "CLOSED",
    staffId,
  });
}

export async function getConversationTimeline(
  platform: BusinessContext,
  conversationId: string,
  includeInternal = true,
): Promise<TimelineMessage[]> {
  assertPermission(platform, PERMISSION_CODES.COMMUNICATION_VIEW);

  const messages = await prisma.communicationMessage.findMany({
    where: { conversationId, businessId: platform.business.id },
    include: { attachments: true },
    orderBy: { createdAt: "asc" },
  });

  const timeline: TimelineMessage[] = mergeTimelineMessages(
    messages.map((m) => ({
      id: m.id,
      messageType: m.messageType,
      senderType: m.senderType,
      channel: m.channel,
      body: m.body,
      deliveryStatus: m.deliveryStatus,
      isInternal: m.isInternal,
      createdAt: m.createdAt,
      attachments: m.attachments.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        mimeType: a.mimeType,
        storageKey: a.storageKey,
        attachmentType: a.attachmentType,
      })),
    })),
    includeInternal,
  );

  return timeline;
}

export async function listInboxConversations(platform: BusinessContext, filter?: InboxFilterInput) {
  assertPermission(platform, PERMISSION_CODES.COMMUNICATION_VIEW);

  const where = buildInboxWhereClause({
    businessId: platform.business.id,
    ...filter,
  });

  let conversations = await prisma.communicationConversation.findMany({
    where,
    orderBy: { lastMessageAt: "desc" },
    take: 100,
  });

  if (filter?.filter === "unread") {
    const unreadConversationIds = await prisma.communicationMessage.findMany({
      where: {
        businessId: platform.business.id,
        deliveryStatus: { in: ["QUEUED", "SENT", "DELIVERED"] },
        messageType: "INBOUND",
        readAt: null,
      },
      select: { conversationId: true },
      distinct: ["conversationId"],
    });

    const ids = new Set(unreadConversationIds.map((r) => r.conversationId));
    conversations = conversations.filter((c) => ids.has(c.id));
  }

  return conversations;
}

export async function searchConversations(
  platform: BusinessContext,
  input: SearchConversationsInput,
) {
  assertPermission(platform, PERMISSION_CODES.COMMUNICATION_VIEW);

  return prisma.communicationConversation.findMany({
    where: buildConversationSearchWhere(platform.business.id, input),
    orderBy: { lastMessageAt: "desc" },
    take: 100,
  });
}

export async function runAiInsight(
  platform: BusinessContext,
  input: AiInsightRequest,
): Promise<{ id: string; requiresApproval: boolean; shouldEscalate: boolean }> {
  assertPermission(platform, PERMISSION_CODES.COMMUNICATION_VIEW);

  const timeline = await getConversationTimeline(platform, input.conversationId, true);
  const insight = generateAiInsight(input.actionType, timeline);
  const shouldEscalate = insight.shouldEscalate || shouldEscalateByConfidence(insight.confidence);

  const record = await prisma.communicationAiInsight.create({
    data: {
      conversationId: input.conversationId,
      businessId: platform.business.id,
      aiAgentId: input.aiAgentId ?? null,
      actionType: input.actionType,
      result: insight.result as Prisma.InputJsonValue,
      confidence: insight.confidence,
      requiresApproval: true,
    },
  });

  const staffId = await getStaffIdForPlatform(platform);

  await logAuditEvent({
    businessId: platform.business.id,
    conversationId: input.conversationId,
    eventType: "AI_ACTION",
    staffId,
    metadata: { actionType: input.actionType, confidence: insight.confidence },
  });

  if (shouldEscalate) {
    await prisma.communicationConversation.updateMany({
      where: { id: input.conversationId, businessId: platform.business.id },
      data: { status: "WAITING_STAFF", priority: "HIGH" },
    });
  }

  return {
    id: record.id,
    requiresApproval: record.requiresApproval,
    shouldEscalate,
  };
}

export async function listCommunicationChannelConnectors(businessId: string) {
  return prisma.communicationChannelConnector.findMany({
    where: { businessId },
    orderBy: { channel: "asc" },
  });
}

export async function listCommunicationAuditLogs(businessId: string, limit = 100) {
  return prisma.communicationAuditLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listConversationActivity(conversationId: string, businessId: string) {
  return prisma.communicationActivityLog.findMany({
    where: { conversationId, businessId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCommunicationDashboard(
  businessId: string,
): Promise<CommunicationDashboardMetrics> {
  const [
    totalConversations,
    openConversations,
    waitingStaff,
    aiHandled,
    unreadMessages,
    channelsConfigured,
  ] = await Promise.all([
    prisma.communicationConversation.count({ where: { businessId } }),
    prisma.communicationConversation.count({
      where: { businessId, status: { not: "CLOSED" } },
    }),
    prisma.communicationConversation.count({ where: { businessId, status: "WAITING_STAFF" } }),
    prisma.communicationConversation.count({ where: { businessId, status: "AI_HANDLED" } }),
    prisma.communicationMessage.count({
      where: {
        businessId,
        messageType: "INBOUND",
        readAt: null,
        deliveryStatus: { in: ["QUEUED", "SENT", "DELIVERED"] },
      },
    }),
    prisma.communicationChannelConnector.count({ where: { businessId, isEnabled: true } }),
  ]);

  return {
    totalConversations,
    openConversations,
    waitingStaff,
    aiHandled,
    unreadMessages,
    channelsConfigured,
  };
}

export async function markMessageRead(platform: BusinessContext, messageId: string): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.COMMUNICATION_VIEW);

  await prisma.communicationMessage.updateMany({
    where: { id: messageId, businessId: platform.business.id },
    data: { deliveryStatus: "READ", readAt: new Date() },
  });
}
