import "server-only";

import { detectIntentsFromText } from "@/services/ai-support-conversation-analysis.service";
import { createSupportRecommendation } from "@/services/ai-support-response-recommendation.service";
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
  const businessId = await getOwnedBusinessId(ownerId);

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

  const results: DetectedIntent[] = [];

  for (const conversation of conversations) {
    const text = conversation.messages.map((m) => m.body).join(" ");
    if (!text.trim()) continue;

    const intents = detectIntentsFromText(text);
    for (const intent of intents) {
      results.push({
        ticketId: conversation.id,
        intent,
        confidence: intent === "general" ? 0.5 : 0.75,
        sampleText: text.slice(0, 150),
      });
    }
  }

  return results;
}

export async function generateIntentRecommendations(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const intents = await detectConversationIntents(ownerId);
  let created = 0;

  for (const item of intents.filter((i) => i.intent !== "general").slice(0, 5)) {
    await createSupportRecommendation(businessId, {
      ticketId: item.ticketId,
      title: `Intent detected: ${item.intent}`,
      description: item.sampleText,
      action: `Route to ${item.intent} support workflow and use relevant knowledge articles.`,
      confidenceScore: item.confidence,
      metadata: { intent: item.intent },
    });
    created += 1;
  }

  return created;
}
