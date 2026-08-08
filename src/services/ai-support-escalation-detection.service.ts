import "server-only";

import { prisma } from "@/lib/prisma";
import {
  createSupportInsight,
  createSupportRecommendation,
} from "@/services/ai-support-response-recommendation.service";
import {
  runOwnerDomainDetectionTask,
  runOwnerDomainInsightTask,
} from "@/services/ai-domain-insight-runner.service";
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
  return runOwnerDomainDetectionTask<EscalationAlert>(ownerId, {
    module: "support",
    task: "escalation-detection",
    responseKey: "alerts",
    loadContext: async (id) => {
      const businessId = await getOwnedBusinessId(id);
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

      return {
        escalationHoursThreshold: ESCALATION_HOURS,
        conversations: conversations.map((conversation) => ({
          id: conversation.id,
          subject: conversation.subject,
          customerName: conversation.customer?.name ?? null,
          priority: conversation.priority,
          lastMessageAt: conversation.lastMessageAt.toISOString(),
          lastInboundMessage: conversation.messages[0]?.body ?? "",
        })),
      };
    },
  });
}

export async function generateEscalationInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "support",
    task: "escalation-insights",
    loadContext: async (ownerId) => ({ ownerId }),
    persistInsight: (businessId, insight) =>
      createSupportInsight(businessId, {
        title: insight.title,
        description: insight.description,
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
    persistRecommendation: (businessId, recommendation) =>
      createSupportRecommendation(businessId, {
        title: recommendation.title,
        description: recommendation.description,
        action: recommendation.action ?? recommendation.recommendation ?? "Review AI recommendation",
        confidenceScore: recommendation.confidenceScore,
        metadata: recommendation.metadata,
      }),
  });
}

export async function generateResponseSuggestions(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "support",
    task: "response-suggestions",
    loadContext: async (ownerId) => ({ ownerId }),
    persistInsight: (businessId, insight) =>
      createSupportInsight(businessId, {
        title: insight.title,
        description: insight.description,
        priority: (insight.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        recommendation: insight.recommendation,
        metadata: insight.metadata,
      }),
    persistRecommendation: (businessId, recommendation) =>
      createSupportRecommendation(businessId, {
        title: recommendation.title,
        description: recommendation.description,
        action: recommendation.action ?? recommendation.recommendation ?? "Review AI recommendation",
        confidenceScore: recommendation.confidenceScore,
        metadata: recommendation.metadata,
      }),
  });
}
