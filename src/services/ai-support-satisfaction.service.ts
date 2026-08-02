import "server-only";

import { prisma } from "@/lib/prisma";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { createSupportInsight } from "@/services/ai-support-response-recommendation.service";

export interface SatisfactionSnapshot {
  satisfactionScore: number;
  satisfactionLabel: string;
  closedTickets: number;
  openTickets: number;
  avgResponseTimeHours: number;
  complaintRatePercent: number;
}

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
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

  const complaintCount = recentMessages.filter((m) =>
    /unhappy|complaint|refund|terrible|awful|disappointed|bad/i.test(m.body),
  ).length;
  const complaintRatePercent =
    recentMessages.length === 0 ? 0 : Math.round((complaintCount / recentMessages.length) * 100);

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
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getSatisfactionSnapshot(ownerId);
  let created = 0;

  await createSupportInsight(businessId, {
    title: "Customer satisfaction score",
    description: `Score: ${snapshot.satisfactionScore}/100 (${snapshot.satisfactionLabel}) · Avg response: ${snapshot.avgResponseTimeHours}h · Complaint rate: ${snapshot.complaintRatePercent}%.`,
    priority: snapshot.satisfactionScore < 60 ? "HIGH" : "MEDIUM",
    recommendation:
      snapshot.complaintRatePercent > 10
        ? "Review complaint patterns and update support scripts."
        : "Maintain current response quality and monitor open ticket volume.",
    metadata: { snapshot },
  });
  created += 1;

  return created;
}

export async function identifyDissatisfiedCustomers(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);

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

  return messages
    .filter((m) => /unhappy|complaint|refund|terrible|awful|disappointed|bad/i.test(m.body))
    .map((m) => ({
      ticketId: m.conversation.id,
      customerId: m.conversation.customer?.id ?? null,
      customerName: m.conversation.customer?.name ?? null,
      subject: m.conversation.subject,
      preview: m.body.slice(0, 120),
    }))
    .slice(0, 10);
}
