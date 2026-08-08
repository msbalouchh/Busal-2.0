import "server-only";

import type { Prisma, RecommendationPriority, RecommendationStatus } from "@prisma/client";

import {
  buildBusinessHealthSummary,
  composeRestaurantAssistantReply,
} from "@/modules/ai-restaurant-assistant-management/engine/restaurant-assistant-engine";
import {
  truncateTitle,
  validateConversationListQuery,
  validateSendMessageInput,
} from "@/modules/ai-restaurant-assistant-management/lib/ai-restaurant-assistant-validation";
import type {
  AssistantResponse,
  BusinessHealthSummary,
  ConversationListQuery,
  ConversationListResult,
  ConversationRecord,
  MessageRecord,
  PeriodSummary,
  RecommendationRecord,
  SendMessageInput,
} from "@/modules/ai-restaurant-assistant-management/types/ai-restaurant-assistant-types";
import { defaultDateRange } from "@/modules/restaurant-analytics-management/lib/restaurant-analytics-validation";
import { prisma } from "@/lib/prisma";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import {
  getExecutiveDashboard,
  getInventoryDashboard,
  getOrdersDashboard,
} from "@/services/restaurant-analytics.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

async function resolveStaffId(ownerId: string, businessId: string): Promise<string | null> {
  const staff = await prisma.staff.findFirst({
    where: { userId: ownerId, businessId, isActive: true },
    select: { id: true },
  });
  return staff?.id ?? null;
}

function toConversationRecord(conversation: {
  id: string;
  businessId: string;
  staffId: string | null;
  title: string;
  status: ConversationRecord["status"];
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: { messages: number };
  messages?: Array<{ content: string }>;
}): ConversationRecord {
  return {
    id: conversation.id,
    businessId: conversation.businessId,
    staffId: conversation.staffId,
    title: conversation.title,
    status: conversation.status,
    isPinned: conversation.isPinned,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    messageCount: conversation._count?.messages,
    lastMessagePreview: conversation.messages?.[0]?.content ?? null,
  };
}

function toMessageRecord(message: {
  id: string;
  conversationId: string;
  role: MessageRecord["role"];
  content: string;
  metadata: Prisma.JsonValue;
  createdAt: Date;
}): MessageRecord {
  return {
    id: message.id,
    conversationId: message.conversationId,
    role: message.role,
    content: message.content,
    metadata: (message.metadata as Record<string, unknown>) ?? {},
    createdAt: message.createdAt.toISOString(),
  };
}

function toRecommendationRecord(recommendation: {
  id: string;
  businessId: string;
  type: string;
  priority: RecommendationRecord["priority"];
  title: string;
  description: string;
  action: string | null;
  status: RecommendationRecord["status"];
  metadata: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}): RecommendationRecord {
  return {
    id: recommendation.id,
    businessId: recommendation.businessId,
    type: recommendation.type,
    priority: recommendation.priority,
    title: recommendation.title,
    description: recommendation.description,
    action: recommendation.action,
    status: recommendation.status,
    metadata: (recommendation.metadata as Record<string, unknown>) ?? {},
    createdAt: recommendation.createdAt.toISOString(),
    updatedAt: recommendation.updatedAt.toISOString(),
  };
}

export async function listConversations(
  ownerId: string,
  query: ConversationListQuery = {},
): Promise<ConversationListResult> {
  validateConversationListQuery(query);
  const businessId = await getOwnedBusinessId(ownerId);
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const where: Prisma.AIConversationWhereInput = {
    businessId,
    ...(query.status && query.status !== "ALL" ? { status: query.status } : {}),
    ...(query.pinnedOnly ? { isPinned: true } : {}),
    ...(query.search?.trim()
      ? { title: { contains: query.search.trim(), mode: "insensitive" } }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.aIConversation.count({ where }),
    prisma.aIConversation.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { messages: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true } },
      },
    }),
  ]);

  return {
    items: items.map(toConversationRecord),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getConversation(
  ownerId: string,
  conversationId: string,
): Promise<{ conversation: ConversationRecord; messages: MessageRecord[] }> {
  const businessId = await getOwnedBusinessId(ownerId);

  const conversation = await prisma.aIConversation.findFirst({
    where: { id: conversationId, businessId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      _count: { select: { messages: true } },
    },
  });

  if (!conversation) throw new Error("Conversation not found");

  return {
    conversation: toConversationRecord(conversation),
    messages: conversation.messages.map(toMessageRecord),
  };
}

export async function sendAssistantMessage(
  ownerId: string,
  input: SendMessageInput,
): Promise<AssistantResponse> {
  validateSendMessageInput(input);
  
  const businessId = await getOwnedBusinessId(ownerId);
  const staffId = await resolveStaffId(ownerId, businessId);

  let conversationId = input.conversationId ?? null;

  if (conversationId) {
    const existing = await prisma.aIConversation.findFirst({
      where: { id: conversationId, businessId },
    });
    if (!existing) throw new Error("Conversation not found");
  } else {
    const created = await prisma.aIConversation.create({
      data: {
        businessId,
        staffId,
        title: truncateTitle(input.message),
        status: "ACTIVE",
      },
    });
    conversationId = created.id;
  }

  await prisma.aIMessage.create({
    data: {
      conversationId,
      role: "USER",
      content: input.message.trim(),
    },
  });

  const composed = await composeRestaurantAssistantReply(ownerId, input.message, input.branchId);

  const assistantMessage = await prisma.aIMessage.create({
    data: {
      conversationId,
      role: "ASSISTANT",
      content: composed.content,
      metadata: {
        intent: composed.intent,
        provider: "ai-engine",
      } as Prisma.InputJsonValue,
    },
  });

  await prisma.aIConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return {
    conversationId,
    message: toMessageRecord(assistantMessage),
    intent: composed.intent,
    insightCards: composed.insightCards,
  };
}

export async function archiveConversation(ownerId: string, conversationId: string): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const conversation = await prisma.aIConversation.findFirst({
    where: { id: conversationId, businessId },
  });
  if (!conversation) throw new Error("Conversation not found");

  await prisma.aIConversation.update({
    where: { id: conversationId },
    data: { status: "ARCHIVED" },
  });
}

export async function pinConversation(
  ownerId: string,
  conversationId: string,
  isPinned: boolean,
): Promise<ConversationRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const conversation = await prisma.aIConversation.findFirst({
    where: { id: conversationId, businessId },
  });
  if (!conversation) throw new Error("Conversation not found");

  const updated = await prisma.aIConversation.update({
    where: { id: conversationId },
    data: { isPinned },
    include: { _count: { select: { messages: true } } },
  });

  return toConversationRecord(updated);
}

export async function listRecommendations(ownerId: string): Promise<RecommendationRecord[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  await syncRecommendations(ownerId, businessId);

  const recommendations = await prisma.aIRecommendation.findMany({
    where: { businessId, status: { not: "DISMISSED" } },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 20,
  });

  return recommendations.map(toRecommendationRecord);
}

export async function updateRecommendationStatus(
  ownerId: string,
  recommendationId: string,
  status: RecommendationStatus,
): Promise<RecommendationRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.aIRecommendation.findFirst({
    where: { id: recommendationId, businessId },
  });
  if (!existing) throw new Error("Recommendation not found");

  const updated = await prisma.aIRecommendation.update({
    where: { id: recommendationId },
    data: { status },
  });

  return toRecommendationRecord(updated);
}

async function syncRecommendations(ownerId: string, businessId: string): Promise<void> {
  const filters = { branchId: null, dateRange: defaultDateRange(7) };
  const [inventory, orders, executive] = await Promise.all([
    getInventoryDashboard(ownerId, filters),
    getOrdersDashboard(ownerId, filters),
    getExecutiveDashboard(ownerId, filters),
  ]);

  const candidates: Array<{
    type: string;
    priority: RecommendationPriority;
    title: string;
    description: string;
    action: string;
  }> = [];

  const lowStockCount = Number(
    inventory.kpis.find((kpi) => kpi.label === "Low stock items")?.value ?? 0,
  );
  if (lowStockCount > 0) {
    candidates.push({
      type: "inventory_reorder",
      priority: lowStockCount >= 5 ? "HIGH" : "MEDIUM",
      title: "Review low stock items",
      description: `${lowStockCount} inventory items are at or below reorder levels.`,
      action: "/app/restaurant/inventory",
    });
  }

  if (orders.cancelledOrders >= 3) {
    candidates.push({
      type: "order_cancellations",
      priority: "MEDIUM",
      title: "Investigate order cancellations",
      description: `${orders.cancelledOrders} orders were cancelled in the last 7 days.`,
      action: "/app/restaurant/analytics/orders",
    });
  }

  const revenueKpi = executive.kpis.find((kpi) => kpi.label === "Revenue");
  if (revenueKpi?.value === "£0.00") {
    candidates.push({
      type: "revenue_alert",
      priority: "CRITICAL",
      title: "No revenue recorded recently",
      description: "No paid orders were found in the current analytics window.",
      action: "/app/restaurant/analytics/sales",
    });
  }

  for (const candidate of candidates) {
    const existing = await prisma.aIRecommendation.findFirst({
      where: {
        businessId,
        type: candidate.type,
        status: { in: ["NEW", "VIEWED"] },
      },
    });

    if (!existing) {
      await prisma.aIRecommendation.create({
        data: {
          businessId,
          type: candidate.type,
          priority: candidate.priority,
          title: candidate.title,
          description: candidate.description,
          action: candidate.action,
        },
      });
    }
  }
}

export async function getBusinessHealth(
  ownerId: string,
  branchId?: string | null,
): Promise<BusinessHealthSummary> {
  return buildBusinessHealthSummary(ownerId, branchId);
}

export async function getPeriodSummaries(
  ownerId: string,
  branchId?: string | null,
): Promise<PeriodSummary[]> {
  const periods: Array<{ period: PeriodSummary["period"]; days: number }> = [
    { period: "daily", days: 1 },
    { period: "weekly", days: 7 },
    { period: "monthly", days: 30 },
  ];

  const summaries: PeriodSummary[] = [];

  for (const entry of periods) {
    const composed = await composeRestaurantAssistantReply(
      ownerId,
      entry.period === "daily"
        ? "Summarize today's business"
        : entry.period === "weekly"
          ? "Weekly sales summary"
          : "Monthly sales summary",
      branchId,
    );

    summaries.push({
      period: entry.period,
      title:
        entry.period === "daily"
          ? "Daily summary"
          : entry.period === "weekly"
            ? "Weekly summary"
            : "Monthly summary",
      content: composed.content,
      insights: composed.insightCards,
    });
  }

  return summaries;
}
