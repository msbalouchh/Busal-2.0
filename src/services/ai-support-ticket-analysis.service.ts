import "server-only";

import { prisma } from "@/lib/prisma";
import { getCommunicationDashboard } from "@/services/communication.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { createSupportInsight } from "@/services/ai-support-response-recommendation.service";

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
  const businessId = await getOwnedBusinessId(ownerId);
  const snapshot = await getTicketAnalysisSnapshot(ownerId);
  let created = 0;

  await createSupportInsight(businessId, {
    title: "Support ticket overview",
    description: `${snapshot.totalOpen} open tickets · ${snapshot.waitingStaff} waiting for staff · ${snapshot.urgentCount} urgent.`,
    priority: snapshot.urgentCount > 0 ? "CRITICAL" : snapshot.waitingStaff > 3 ? "HIGH" : "MEDIUM",
    recommendation:
      snapshot.waitingStaff > 0
        ? "Prioritize tickets in WAITING_STAFF status to reduce response times."
        : "Ticket queue is manageable — review AI-handled conversations for quality.",
    metadata: { snapshot },
  });
  created += 1;

  for (const ticket of snapshot.tickets.filter((t) => t.openDurationHours > 24).slice(0, 3)) {
    await createSupportInsight(businessId, {
      ticketId: ticket.id,
      customerId: ticket.customerId ?? undefined,
      title: `Unresolved ticket: ${ticket.subject ?? "No subject"}`,
      description: `Open for ${ticket.openDurationHours} hours · ${ticket.messageCount} messages.`,
      priority: ticket.openDurationHours > 48 ? "CRITICAL" : "HIGH",
      recommendation: "Assign to staff or send follow-up to customer.",
      metadata: { ticketId: ticket.id },
    });
    created += 1;
  }

  return created;
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
