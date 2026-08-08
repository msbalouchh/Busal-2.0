import "server-only";

import { createSupportInsight, createSupportRecommendation } from "@/services/ai-support-response-recommendation.service";
import {
  runOwnerDomainDetectionTask,
  runOwnerDomainInsightTask,
} from "@/services/ai-domain-insight-runner.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { prisma } from "@/lib/prisma";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export interface DetectedIntent {
  ticketId: string;
  intent: string;
  confidence: number;
  sampleText: string;
}

export async function detectConversationIntents(ownerId: string): Promise<DetectedIntent[]> {
  return runOwnerDomainDetectionTask<DetectedIntent>(ownerId, {
    module: "support",
    task: "conversation-intent-detection",
    responseKey: "intents",
    loadContext: async (id) => {
      const businessId = await getOwnedBusinessId(id);
      const conversations = await prisma.communicationConversation.findMany({
        where: { businessId, status: { not: "CLOSED" } },
        include: {
          messages: {
            where: { messageType: "INBOUND" },
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
        take: 15,
      });

      return {
        conversations: conversations.map((conversation) => ({
          ticketId: conversation.id,
          messages: conversation.messages.map((message) => message.body),
        })),
      };
    },
  });
}

export async function generateIntentRecommendations(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "support",
    task: "intent-recommendations",
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
