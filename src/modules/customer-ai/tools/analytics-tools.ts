import "server-only";

import { prisma } from "@/lib/prisma";
import { CUSTOMER_AI_EVENT_TYPES } from "@/modules/customer-ai/constants/customer-ai.constants";
import { AI_BUSINESS_TOOL_IDS } from "@/modules/customer-ai/constants/customer-ai.constants";
import { listAiBusinessActions } from "@/modules/customer-ai/tools/tool-audit.service";
import { getBusinessRevenueSnapshot } from "@/modules/customer-ai/services/revenue-aggregation.service";
import { orderTools } from "@/modules/customer-ai/tools/order-tools";
import { reservationTools } from "@/modules/customer-ai/tools/reservation-tools";
import type { AiBusinessToolDefinition } from "@/modules/customer-ai/tools/tool-types";

async function runEmbeddedTool(
  tools: AiBusinessToolDefinition[],
  toolId: string,
  input: Record<string, unknown>,
  context: Parameters<AiBusinessToolDefinition["handler"]>[1],
): Promise<Record<string, unknown>> {
  const tool = tools.find((entry) => entry.toolId === toolId);
  if (!tool) return { error: `Tool unavailable: ${toolId}` };
  const result = await tool.handler(input, context);
  return result === null ? { error: `Tool returned no result: ${toolId}` } : (result as Record<string, unknown>);
}

export const analyticsTools: AiBusinessToolDefinition[] = [
  {
    toolId: AI_BUSINESS_TOOL_IDS.OPERATIONAL_SUMMARY,
    name: "Operational Summary",
    description: "Summarize today's business operations using real data.",
    inputSchema: { type: "object", properties: {} },
    permission: "ai.analytics.read",
    riskLevel: "READ",
    audience: "OWNER",
    handler: async (_input, context) => {
      const [ordersSummary, reservationsTomorrow, conversations, escalations] = await Promise.all([
        runEmbeddedTool(orderTools, AI_BUSINESS_TOOL_IDS.ORDERS_SUMMARY_TODAY, {}, context),
        runEmbeddedTool(reservationTools, AI_BUSINESS_TOOL_IDS.RESERVATIONS_TOMORROW, {}, context),
        prisma.aIConversation.count({
          where: {
            businessId: context.businessId,
            audienceType: "CUSTOMER",
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
        prisma.customerAiEvent.count({
          where: {
            businessId: context.businessId,
            eventType: CUSTOMER_AI_EVENT_TYPES.ESCALATED,
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
      ]);

      return {
        ordersToday: ordersSummary,
        reservationsTomorrow,
        aiConversationsToday: conversations,
        escalationsToday: escalations,
        revenueAvailable: typeof ordersSummary.revenue === "number",
        note: "All metrics sourced from live Busal data.",
      };
    },
  },
  {
    toolId: AI_BUSINESS_TOOL_IDS.AI_ACTIVITY_SUMMARY,
    name: "AI Activity Summary",
    description: "Summarize AI conversations, tool executions, and escalations.",
    inputSchema: { type: "object", properties: { days: { type: "number" } } },
    permission: "ai.analytics.read",
    riskLevel: "READ",
    audience: "OWNER",
    handler: async (input, context) => {
      const days = typeof input.days === "number" ? input.days : 7;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const [events, actions, conversations] = await Promise.all([
        prisma.customerAiEvent.groupBy({
          by: ["eventType"],
          where: { businessId: context.businessId, createdAt: { gte: since } },
          _count: { eventType: true },
        }),
        listAiBusinessActions(context.businessId, 20),
        prisma.aIConversation.count({
          where: { businessId: context.businessId, audienceType: "CUSTOMER", createdAt: { gte: since } },
        }),
      ]);

      return {
        periodDays: days,
        totalConversations: conversations,
        events: events.map((entry) => ({ type: entry.eventType, count: entry._count.eventType })),
        recentActions: actions,
      };
    },
  },
  {
    toolId: AI_BUSINESS_TOOL_IDS.CUSTOMER_ISSUES,
    name: "Customer Issues",
    description: "List escalated or unresolved customer conversations.",
    inputSchema: { type: "object", properties: { limit: { type: "number" } } },
    permission: "ai.analytics.read",
    riskLevel: "READ",
    audience: "OWNER",
    handler: async (input, context) => {
      const limit = typeof input.limit === "number" ? input.limit : 20;
      const conversations = await prisma.aIConversation.findMany({
        where: {
          businessId: context.businessId,
          audienceType: "CUSTOMER",
          OR: [{ escalatedAt: { not: null } }, { status: "ACTIVE" }],
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        select: {
          id: true,
          title: true,
          channel: true,
          escalatedAt: true,
          customer: { select: { fullName: true, name: true } },
          updatedAt: true,
        },
      });

      return {
        issues: conversations.map((conv) => ({
          conversationId: conv.id,
          title: conv.title,
          channel: conv.channel,
          customerName: conv.customer?.fullName ?? conv.customer?.name ?? null,
          escalated: Boolean(conv.escalatedAt),
          lastActivity: conv.updatedAt.toISOString(),
        })),
      };
    },
  },
  {
    toolId: AI_BUSINESS_TOOL_IDS.REVENUE_SUMMARY,
    name: "Revenue Summary",
    description: "Summarize revenue from paid restaurant orders for today, yesterday, week, and month.",
    inputSchema: { type: "object", properties: {} },
    permission: "ai.analytics.read",
    riskLevel: "READ",
    audience: "OWNER",
    handler: async (_input, context) => {
      const snapshot = await getBusinessRevenueSnapshot(context.businessId);
      if (!snapshot.revenueAvailable) {
        return {
          revenueAvailable: false,
          error: "Revenue data is not available for this business.",
          definition: snapshot.definition,
        };
      }
      return {
        revenueAvailable: snapshot.revenueAvailable,
        currency: snapshot.currency,
        definition: snapshot.definition,
        periods: snapshot.periods,
      };
    },
  },
];
