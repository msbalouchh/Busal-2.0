import "server-only";

import { listKnowledgeDocuments, retrieveKnowledge } from "@/services/ai-knowledge.service";
import {
  createSupportInsight,
  createSupportRecommendation,
} from "@/services/ai-support-response-recommendation.service";
import { runOwnerDomainInsightTask } from "@/services/ai-domain-insight-runner.service";
import { detectIntentsFromText } from "@/services/ai-support-conversation-analysis.service";
import { resolveBusinessContextForOwner } from "@/services/ai-engine-bridge.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

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
  const platform = await resolveBusinessContextForOwner(ownerId);
  const [retrieval, intents, documents] = await Promise.all([
    retrieveKnowledge(platform, query, { limit: 5, agentId: "support-knowledge" }),
    detectIntentsFromText(ownerId, query),
    listKnowledgeDocuments(platform.business.id),
  ]);

  const byDocumentId = new Map(
    documents.map((doc) => [
      doc.id,
      {
        documentId: doc.id,
        title: doc.title,
        collectionName: doc.collection.name,
        relevanceScore: 0,
        reason: "Available knowledge base article",
      },
    ]),
  );

  for (const citation of retrieval.citations) {
    const existing = byDocumentId.get(citation.documentId);
    if (existing) {
      existing.relevanceScore = Math.max(existing.relevanceScore, citation.score);
      existing.reason = "Semantic knowledge match";
    } else {
      byDocumentId.set(citation.documentId, {
        documentId: citation.documentId,
        title: citation.documentTitle,
        collectionName: citation.collectionName,
        relevanceScore: citation.score,
        reason: "Semantic knowledge match",
      });
    }
  }

  for (const intent of intents) {
    for (const entry of byDocumentId.values()) {
      if (entry.title.toLowerCase().includes(intent.toLowerCase())) {
        entry.relevanceScore = Math.max(entry.relevanceScore, 0.5);
        entry.reason = `Matched intent: ${intent}`;
      }
    }
  }

  return Array.from(byDocumentId.values())
    .filter((entry) => entry.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5);
}

export async function listKnowledgeSuggestionsForTicket(
  ownerId: string,
  ticketId: string,
): Promise<KnowledgeSuggestion[]> {
  const { prisma } = await import("@/lib/prisma");
  const businessId = await getOwnedBusinessId(ownerId);
  const conversation = await prisma.communicationConversation.findFirst({
    where: { id: ticketId, businessId },
    include: {
      messages: {
        where: { messageType: "INBOUND" },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
  });

  const query =
    conversation?.messages.map((message) => message.body).join(" ").trim() ||
    conversation?.subject?.trim() ||
    "support ticket";

  return suggestKnowledgeArticles(ownerId, query);
}

export async function generateKnowledgeRecommendations(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "support",
    task: "knowledge-recommendations",
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
