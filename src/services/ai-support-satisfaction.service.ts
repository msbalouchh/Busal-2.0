import "server-only";

import { prisma } from "@/lib/prisma";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { createSupportInsight } from "@/services/ai-support-response-recommendation.service";
import {
  runOwnerDomainDetectionTask,
  runOwnerDomainInsightTask,
} from "@/services/ai-engine-bridge.service";

export interface SatisfactionSnapshot {
  satisfactionScore: number;
  satisfactionLabel: string;
  closedTickets: number;
  openTickets: number;
  avgResponseTimeHours: number;
  complaintRatePercent: number;
}

interface ComplaintFlag {
  messageIndex: number;
}

interface DissatisfiedCustomerItem {
  ticketId: string;
  customerId: string | null;
  customerName: string | null;
  subject: string;
  preview: string;
}

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

async function detectComplaintMessageIndexes(
  ownerId: string,
  messages: Array<{ body: string }>,
): Promise<number[]> {
  if (messages.length === 0) return [];

  const flagged = await runOwnerDomainDetectionTask<ComplaintFlag>(ownerId, {
    module: "support",
    task: "complaint-message-detection",
    responseKey: "complaints",
    instructions:
      'Return JSON only: { "complaints": [{ "messageIndex": number }] } listing indexes of inbound messages expressing dissatisfaction, complaints, refund requests, or clearly negative sentiment.',
    loadContext: async () => ({
      messages: messages.map((message, index) => ({
        messageIndex: index,
        body: message.body.slice(0, 500),
      })),
    }),
  });

  return flagged
    .map((entry) => entry.messageIndex)
    .filter((index) => Number.isInteger(index) && index >= 0 && index < messages.length);
}

export async function getSatisfactionSnapshot(ownerId: string): Promise<SatisfactionSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);

  const [openTickets, closedTickets, recentMessages] = await Promise.all([
    prisma.communicationConversation.count({
      where: { businessId, status: { not: "CLOSED" } },
    }),
    prisma.communicationConversation.count({
      where: {
        businessId,
        status: "CLOSED",
        closedAt: { gte: new Date(Date.now() - 30 * 86400000) },
      },
    }),
    prisma.communicationMessage.findMany({
      where: {
        businessId,
        messageType: "INBOUND",
        createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
      },
      select: { body: true, createdAt: true, conversationId: true },
      take: 100,
    }),
  ]);

  const complaintIndexes = await detectComplaintMessageIndexes(ownerId, recentMessages);
  const complaintRatePercent =
    recentMessages.length === 0
      ? 0
      : Math.round((complaintIndexes.length / recentMessages.length) * 100);

  const responseTimes: number[] = [];
  const conversationIds = [...new Set(recentMessages.map((m) => m.conversationId))].slice(0, 20);

  for (const conversationId of conversationIds) {
    const messages = await prisma.communicationMessage.findMany({
      where: { conversationId, businessId },
      orderBy: { createdAt: "asc" },
      take: 4,
    });

    const inbound = messages.find((m) => m.messageType === "INBOUND");
    const outbound = messages.find(
      (m) => m.messageType === "OUTBOUND" && inbound && m.createdAt > inbound.createdAt,
    );
    if (inbound && outbound) {
      responseTimes.push(
        (outbound.createdAt.getTime() - inbound.createdAt.getTime()) / (1000 * 60 * 60),
      );
    }
  }

  const avgResponseTimeHours =
    responseTimes.length === 0
      ? 0
      : Math.round((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) * 10) / 10;

  let satisfactionScore = 100;
  satisfactionScore -= complaintRatePercent;
  satisfactionScore -= Math.min(30, openTickets * 2);
  satisfactionScore -= avgResponseTimeHours > 4 ? 15 : avgResponseTimeHours > 2 ? 8 : 0;
  satisfactionScore = Math.max(0, Math.min(100, satisfactionScore));

  const satisfactionLabel =
    satisfactionScore >= 80
      ? "Excellent"
      : satisfactionScore >= 60
        ? "Good"
        : satisfactionScore >= 40
          ? "Fair"
          : "Needs improvement";

  return {
    satisfactionScore,
    satisfactionLabel,
    closedTickets,
    openTickets,
    avgResponseTimeHours,
    complaintRatePercent,
  };
}

export async function generateSatisfactionInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "support",
    task: "satisfaction-insights",
    loadContext: getSatisfactionSnapshot,
    persistInsight: (businessId, insight) =>
      createSupportInsight(businessId, {
        title: insight.title,
        description: insight.description,
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
  });
}

export async function identifyDissatisfiedCustomers(ownerId: string) {
  return runOwnerDomainDetectionTask<DissatisfiedCustomerItem>(ownerId, {
    module: "support",
    task: "dissatisfied-customer-detection",
    responseKey: "customers",
    instructions:
      'Return JSON only: { "customers": [{ "ticketId": string, "customerId": string|null, "customerName": string|null, "subject": string, "preview": string }] } for up to 10 dissatisfied customers grounded in the supplied messages.',
    loadContext: async (id) => {
      const businessId = await getOwnedBusinessId(id);

      const messages = await prisma.communicationMessage.findMany({
        where: {
          businessId,
          messageType: "INBOUND",
          createdAt: { gte: new Date(Date.now() - 14 * 86400000) },
        },
        include: {
          conversation: {
            select: {
              id: true,
              subject: true,
              customer: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return {
        messages: messages.map((message) => ({
          ticketId: message.conversation.id,
          customerId: message.conversation.customer?.id ?? null,
          customerName: message.conversation.customer?.name ?? null,
          subject: message.conversation.subject,
          body: message.body.slice(0, 500),
        })),
      };
    },
  });
}
