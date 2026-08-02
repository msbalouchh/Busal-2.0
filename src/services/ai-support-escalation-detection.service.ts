import "server-only";

import { prisma } from "@/lib/prisma";
import {
  createSupportInsight,
  createSupportRecommendation,
} from "@/services/ai-support-response-recommendation.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export interface EscalationAlert {
  ticketId: string;
  subject: string | null;
  customerName: string | null;
  reason: string;
  priority: "HIGH" | "CRITICAL";
  waitingHours: number;
}

const ESCALATION_HOURS = 24;

export async function detectEscalations(ownerId: string): Promise<EscalationAlert[]> {
  const businessId = await getOwnedBusinessId(ownerId);

  const conversations = await prisma.communicationConversation.findMany({
    where: {
      businessId,
      status: { in: ["OPEN", "WAITING_STAFF"] },
    },
    include: {
      customer: { select: { name: true } },
      messages: {
        where: { messageType: "INBOUND" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const alerts: EscalationAlert[] = [];

  for (const conversation of conversations) {
    const waitingHours = Math.round(
      (Date.now() - conversation.lastMessageAt.getTime()) / (1000 * 60 * 60),
    );
    const lastMessage = conversation.messages[0]?.body ?? "";
    const isComplaint = /unhappy|complaint|refund|terrible|awful|disappointed/i.test(lastMessage);

    if (conversation.priority === "URGENT" || isComplaint) {
      alerts.push({
        ticketId: conversation.id,
        subject: conversation.subject,
        customerName: conversation.customer?.name ?? null,
        reason: isComplaint ? "Customer complaint detected" : "Urgent priority ticket",
        priority: "CRITICAL",
        waitingHours,
      });
    } else if (waitingHours >= ESCALATION_HOURS) {
      alerts.push({
        ticketId: conversation.id,
        subject: conversation.subject,
        customerName: conversation.customer?.name ?? null,
        reason: `No response for ${waitingHours}+ hours`,
        priority: "HIGH",
        waitingHours,
      });
    }
  }

  return alerts.sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1 };
    return order[a.priority] - order[b.priority];
  });
}

export async function generateEscalationInsights(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const alerts = await detectEscalations(ownerId);
  let created = 0;

  if (alerts.length > 0) {
    await createSupportInsight(businessId, {
      title: "Escalation alerts",
      description: `${alerts.length} tickets require escalation or immediate attention.`,
      priority: "CRITICAL",
      recommendation: "Assign senior staff to critical tickets and respond within SLA.",
      metadata: { alertCount: alerts.length },
    });
    created += 1;
  }

  for (const alert of alerts.slice(0, 3)) {
    await createSupportRecommendation(businessId, {
      ticketId: alert.ticketId,
      title: `Escalate: ${alert.subject ?? "Ticket"}`,
      description: alert.reason,
      action: "Escalate to supervisor and send acknowledgment to customer.",
      confidenceScore: alert.priority === "CRITICAL" ? 0.95 : 0.8,
      metadata: { reason: alert.reason },
    });
    created += 1;
  }

  return created;
}

export async function generateResponseSuggestions(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  let created = 0;

  const conversations = await prisma.communicationConversation.findMany({
    where: { businessId, status: "WAITING_STAFF" },
    include: {
      messages: {
        where: { messageType: "INBOUND" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    take: 5,
  });

  for (const conversation of conversations) {
    const lastMessage = conversation.messages[0]?.body;
    if (!lastMessage) continue;

    await createSupportRecommendation(businessId, {
      ticketId: conversation.id,
      title: "Suggested reply",
      description: `In response to: "${lastMessage.slice(0, 100)}..."`,
      action: `Thank the customer, acknowledge their concern, and provide a clear next step or timeline.`,
      confidenceScore: 0.7,
      metadata: { type: "response_suggestion" },
    });
    created += 1;
  }

  return created;
}
