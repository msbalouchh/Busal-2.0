import "server-only";

import { prisma } from "@/lib/prisma";
import type { SupportPriority } from "@prisma/client";
import { createSupportInsight } from "@/services/ai-support-response-recommendation.service";
import {
  runOwnerDomainDetectionTask,
  runOwnerDomainInsightTask,
} from "@/services/ai-domain-insight-runner.service";
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
  return runOwnerDomainDetectionTask<{
    ticketId: string;
    subject: string | null;
    customerName: string | null;
    communicationPriority: string;
    supportPriority: SupportPriority;
    status: string;
    waitingHours: number;
  }>(ownerId, {
    module: "support",
    task: "ticket-priority-detection",
    responseKey: "tickets",
    loadContext: async (id) => {
      const businessId = await getOwnedBusinessId(id);
      const conversations = await prisma.communicationConversation.findMany({
        where: { businessId, status: { in: ["OPEN", "WAITING_STAFF", "WAITING_CUSTOMER"] } },
        include: { customer: { select: { name: true } } },
        orderBy: [{ priority: "desc" }, { lastMessageAt: "asc" }],
        take: 20,
      });

      return {
        conversations: conversations.map((conversation) => ({
          ticketId: conversation.id,
          subject: conversation.subject,
          customerName: conversation.customer?.name ?? null,
          communicationPriority: conversation.priority,
          supportPriority: mapCommunicationPriority(conversation.priority),
          status: conversation.status,
          waitingHours: Math.round(
            (Date.now() - conversation.lastMessageAt.getTime()) / (1000 * 60 * 60),
          ),
        })),
      };
    },
  });
}

export async function generatePriorityInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "support",
    task: "priority-insights",
    loadContext: async (ownerId) => ({ ownerId }),
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
