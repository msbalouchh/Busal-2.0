import "server-only";

import { listKnowledgeDocuments } from "@/services/ai-knowledge.service";
import { createSupportRecommendation } from "@/services/ai-support-response-recommendation.service";
import { detectIntentsFromText } from "@/services/ai-support-conversation-analysis.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { prisma } from "@/lib/prisma";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export interface KnowledgeSuggestion {
  documentId: string;
  title: string;
  collectionName: string;
  relevanceScore: number;
  reason: string;
}

export async function suggestKnowledgeArticles(
  ownerId: string,
  query: string,
): Promise<KnowledgeSuggestion[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  const documents = await listKnowledgeDocuments(businessId);
  const intents = detectIntentsFromText(query);
  const queryLower = query.toLowerCase();

  return documents
    .map((doc) => {
      const title = doc.title;
      const titleLower = title.toLowerCase();
      let score = 0;

      for (const intent of intents) {
        if (titleLower.includes(intent)) score += 0.3;
      }
      if (queryLower.split(" ").some((word) => word.length > 3 && titleLower.includes(word))) {
        score += 0.4;
      }

      return {
        documentId: doc.id,
        title,
        collectionName: doc.collection.name,
        relevanceScore: Math.min(1, score),
        reason: score > 0 ? "Keyword match" : "Available knowledge base article",
      };
    })
    .filter((s) => s.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5);
}

export async function generateKnowledgeRecommendations(ownerId: string): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  let created = 0;

  const conversations = await prisma.communicationConversation.findMany({
    where: { businessId, status: { not: "CLOSED" } },
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
    const lastMessage = conversation.messages[0]?.body ?? conversation.subject ?? "";
    if (!lastMessage.trim()) continue;

    const suggestions = await suggestKnowledgeArticles(ownerId, lastMessage);
    const top = suggestions[0];
    if (!top) continue;

    await createSupportRecommendation(businessId, {
      ticketId: conversation.id,
      title: `Knowledge article: ${top.title}`,
      description: `From collection "${top.collectionName}"`,
      action: `Share article "${top.title}" with the customer.`,
      confidenceScore: top.relevanceScore,
      metadata: { documentId: top.documentId },
    });
    created += 1;
  }

  return created;
}

export async function listKnowledgeSuggestionsForTicket(ownerId: string, ticketId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const messages = await prisma.communicationMessage.findMany({
    where: { conversationId: ticketId, businessId, messageType: "INBOUND" },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const query = messages.map((m) => m.body).join(" ") || "";
  return suggestKnowledgeArticles(ownerId, query);
}
