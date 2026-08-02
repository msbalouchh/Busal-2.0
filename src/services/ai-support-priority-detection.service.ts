import "server-only";

import { prisma } from "@/lib/prisma";
import type { SupportPriority } from "@prisma/client";
import { createSupportInsight } from "@/services/ai-support-response-recommendation.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

function mapCommunicationPriority(priority: string): SupportPriority {
  switch (priority) {
    case "URGENT":
      return "CRITICAL";
    case "HIGH":
      return "HIGH";
    case "LOW":
      return "LOW";
    default:
      return "MEDIUM";
  }
}

export async function detectTicketPriorities(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);

  const conversations = await prisma.communicationConversation.findMany({
    where: { businessId, status: { in: ["OPEN", "WAITING_STAFF", "WAITING_CUSTOMER"] } },
    include: { customer: { select: { name: true } } },
    orderBy: [{ priority: "desc" }, { lastMessageAt: "asc" }],
    take: 20,
  });

  return conversations.map((c) => ({
    ticketId: c.id,
    subject: c.subject,
    customerName: c.customer?.name ?? null,
    communicationPriority: c.priority,
    supportPriority: mapCommunicationPriority(c.priority),
    status: c.status,
    waitingHours: Math.round((Date.now() - c.lastMessageAt.getTime()) / (1000 * 60 * 60)),
  }));
}

export async function generatePriorityInsights(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const tickets = await detectTicketPriorities(ownerId);
  let created = 0;

  const urgent = tickets.filter(
    (t) => t.supportPriority === "CRITICAL" || t.supportPriority === "HIGH",
  );
  if (urgent.length > 0) {
    await createSupportInsight(businessId, {
      title: "Tickets requiring urgent attention",
      description: `${urgent.length} high-priority tickets need immediate response.`,
      priority: "CRITICAL",
      recommendation: urgent.map((t) => t.subject ?? t.ticketId).join(", "),
      metadata: { ticketIds: urgent.map((t) => t.ticketId) },
    });
    created += 1;
  }

  return created;
}
