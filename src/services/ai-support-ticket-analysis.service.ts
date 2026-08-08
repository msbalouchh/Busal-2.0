import "server-only";

import { prisma } from "@/lib/prisma";
import { getCommunicationDashboard } from "@/services/communication.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { createSupportInsight } from "@/services/ai-support-response-recommendation.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";

export interface TicketSnapshot {
  id: string;
  subject: string | null;
  status: string;
  priority: string;
  customerId: string | null;
  customerName: string | null;
  lastMessageAt: string;
  messageCount: number;
  openDurationHours: number;
}

export interface TicketAnalysisSnapshot {
  totalOpen: number;
  waitingStaff: number;
  urgentCount: number;
  unresolvedCount: number;
  tickets: TicketSnapshot[];
}

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

function mapTicket(conversation: {
  id: string;
  subject: string | null;
  status: string;
  priority: string;
  customerId: string | null;
  lastMessageAt: Date;
  createdAt: Date;
  customer: { name: string } | null;
  _count: { messages: number };
}): TicketSnapshot {
  const openDurationHours = Math.round(
    (Date.now() - conversation.createdAt.getTime()) / (1000 * 60 * 60),
  );

  return {
    id: conversation.id,
    subject: conversation.subject,
    status: conversation.status,
    priority: conversation.priority,
    customerId: conversation.customerId,
    customerName: conversation.customer?.name ?? null,
    lastMessageAt: conversation.lastMessageAt.toISOString(),
    messageCount: conversation._count.messages,
    openDurationHours,
  };
}

export async function getTicketAnalysisSnapshot(ownerId: string): Promise<TicketAnalysisSnapshot> {
  const businessId = await getOwnedBusinessId(ownerId);
  const dashboard = await getCommunicationDashboard(businessId);

  const conversations = await prisma.communicationConversation.findMany({
    where: { businessId, status: { not: "CLOSED" } },
    include: {
      customer: { select: { name: true } },
      _count: { select: { messages: true } },
    },
    orderBy: [{ priority: "desc" }, { lastMessageAt: "asc" }],
    take: 20,
  });

  const tickets = conversations.map(mapTicket);
  const urgentCount = tickets.filter(
    (t) => t.priority === "URGENT" || t.priority === "HIGH",
  ).length;
  const unresolvedCount = tickets.filter(
    (t) => t.status === "WAITING_STAFF" || t.status === "OPEN",
  ).length;

  return {
    totalOpen: dashboard.openConversations,
    waitingStaff: dashboard.waitingStaff,
    urgentCount,
    unresolvedCount,
    tickets,
  };
}

export async function generateTicketInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "support",
    task: "ticket-insights",
    loadContext: getTicketAnalysisSnapshot,
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

export async function listOpenTickets(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const conversations = await prisma.communicationConversation.findMany({
    where: { businessId, status: { not: "CLOSED" } },
    include: {
      customer: { select: { id: true, name: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 30,
  });

  return conversations.map(mapTicket);
}
