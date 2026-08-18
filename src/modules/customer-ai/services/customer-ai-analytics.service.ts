import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { CUSTOMER_AI_EVENT_TYPES } from "@/modules/customer-ai/constants/customer-ai.constants";
import type { CustomerAiAnalyticsSnapshot } from "@/modules/customer-ai/types/customer-ai.types";

export async function recordCustomerAiEvent(input: {
  businessId: string;
  conversationId?: string;
  eventType: string;
  channel?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.customerAiEvent.create({
    data: {
      businessId: input.businessId,
      conversationId: input.conversationId ?? null,
      eventType: input.eventType,
      channel: input.channel ?? "website",
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function getCustomerAiAnalytics(
  businessId: string,
  days = 30,
): Promise<CustomerAiAnalyticsSnapshot> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [events, conversations, auditLogs] = await Promise.all([
    prisma.customerAiEvent.findMany({
      where: { businessId, createdAt: { gte: since } },
      select: { eventType: true },
    }),
    prisma.aIConversation.count({
      where: { businessId, audienceType: "CUSTOMER", createdAt: { gte: since } },
    }),
    prisma.aiAgentAuditLog.findMany({
      where: {
        businessId,
        entityType: "customer_conversation",
        createdAt: { gte: since },
      },
      select: { metadata: true },
    }),
  ]);

  const countByType = (type: string) => events.filter((e) => e.eventType === type).length;

  const tokenUsageEstimate = auditLogs.reduce((sum, log) => {
    const meta = log.metadata as { totalTokens?: number } | null;
    return sum + (meta?.totalTokens ?? 0);
  }, 0);

  return {
    totalConversations: conversations,
    questionsAnswered: countByType(CUSTOMER_AI_EVENT_TYPES.QUESTION_ANSWERED),
    unresolvedQuestions: countByType(CUSTOMER_AI_EVENT_TYPES.UNRESOLVED),
    escalations: countByType(CUSTOMER_AI_EVENT_TYPES.ESCALATED),
    reservationsAssisted: countByType(CUSTOMER_AI_EVENT_TYPES.RESERVATION_ASSISTED),
    ordersAssisted: countByType(CUSTOMER_AI_EVENT_TYPES.ORDER_ASSISTED),
    toolExecutions: countByType(CUSTOMER_AI_EVENT_TYPES.TOOL_EXECUTED),
    confirmationRequired: countByType(CUSTOMER_AI_EVENT_TYPES.CONFIRMATION_REQUIRED),
    tokenUsageEstimate,
  };
}

export async function listCustomerConversations(
  businessId: string,
  limit = 50,
): Promise<
  Array<{
    id: string;
    customerId: string | null;
    customerName: string | null;
    channel: string;
    title: string;
    status: string;
    messageCount: number;
    lastMessageAt: string;
    escalated: boolean;
  }>
> {
  const conversations = await prisma.aIConversation.findMany({
    where: { businessId, audienceType: "CUSTOMER" },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      customer: { select: { fullName: true, name: true } },
      messages: { select: { id: true }, take: 1 },
      _count: { select: { messages: true } },
    },
  });

  return conversations.map((conv) => ({
    id: conv.id,
    customerId: conv.customerId,
    customerName: conv.customer?.fullName ?? conv.customer?.name ?? null,
    channel: conv.channel ?? "website",
    title: conv.title,
    status: conv.status,
    messageCount: conv._count.messages,
    lastMessageAt: conv.updatedAt.toISOString(),
    escalated: Boolean(conv.escalatedAt),
  }));
}

export async function getCustomerConversationDetail(
  businessId: string,
  conversationId: string,
): Promise<{
  id: string;
  title: string;
  channel: string;
  customerName: string | null;
  escalated: boolean;
  messages: Array<{ id: string; role: string; content: string; createdAt: string }>;
} | null> {
  const conversation = await prisma.aIConversation.findFirst({
    where: { id: conversationId, businessId, audienceType: "CUSTOMER" },
    include: {
      customer: { select: { fullName: true, name: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true, createdAt: true },
      },
    },
  });

  if (!conversation) return null;

  return {
    id: conversation.id,
    title: conversation.title,
    channel: conversation.channel ?? "website",
    customerName: conversation.customer?.fullName ?? conversation.customer?.name ?? null,
    escalated: Boolean(conversation.escalatedAt),
    messages: conversation.messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    })),
  };
}

export async function escalateCustomerConversation(
  businessId: string,
  conversationId: string,
): Promise<void> {
  await prisma.aIConversation.updateMany({
    where: { id: conversationId, businessId, audienceType: "CUSTOMER" },
    data: { escalatedAt: new Date(), status: "ACTIVE" },
  });

  await recordCustomerAiEvent({
    businessId,
    conversationId,
    eventType: CUSTOMER_AI_EVENT_TYPES.ESCALATED,
  });

  const conv = await prisma.aIConversation.findFirst({
    where: { id: conversationId, businessId },
    select: { customerId: true, channel: true, title: true },
  });

  if (conv) {
    await prisma.communicationConversation.create({
      data: {
        businessId,
        customerId: conv.customerId,
        sourceChannel: mapChannelToCommunication(conv.channel ?? "website"),
        inboxType: "TEAM",
        subject: conv.title,
        status: "OPEN",
        tags: ["ai-escalation"],
      },
    }).catch(() => {
      // Communication module may not be fully configured — escalation still recorded on AI conversation
    });
  }
}

function mapChannelToCommunication(
  channel: string,
): "LIVE_CHAT" | "WHATSAPP" | "EMAIL" | "WEB_CONTACT_FORM" | "FACEBOOK_MESSENGER" | "INSTAGRAM_DIRECT" {
  switch (channel) {
    case "whatsapp":
      return "WHATSAPP";
    case "facebook":
      return "FACEBOOK_MESSENGER";
    case "instagram":
      return "INSTAGRAM_DIRECT";
    case "email":
      return "EMAIL";
    default:
      return "LIVE_CHAT";
  }
}
