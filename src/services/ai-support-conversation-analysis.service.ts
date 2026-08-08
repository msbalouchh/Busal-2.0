import "server-only";

import { prisma } from "@/lib/prisma";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { createSupportInsight } from "@/services/ai-support-response-recommendation.service";
import {
  runOwnerDomainDetectionTask,
  runOwnerDomainInsightTask,
} from "@/services/ai-domain-insight-runner.service";

export interface ConversationSummary {
  ticketId: string;
  subject: string | null;
  customerName: string | null;
  messageCount: number;
  summary: string;
  lastMessagePreview: string;
  intents: string[];
}

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

/** Routes intent detection through the centralized AI engine. */
export async function detectIntentsFromText(ownerId: string, text: string): Promise<string[]> {
  const intents = await runOwnerDomainDetectionTask<{ intent: string }>(ownerId, {
    module: "support",
    task: "conversation-intent-classification",
    responseKey: "intents",
    loadContext: async () => ({ text: text.slice(0, 2000) }),
    instructions:
      'Classify customer message intents. Return JSON: { "intents": [{ "intent": string }] }',
  });

  const values = intents.map((entry) => entry.intent).filter(Boolean);
  return values.length > 0 ? values : ["general"];
}

export async function summarizeConversation(
  ownerId: string,
  ticketId: string,
): Promise<ConversationSummary | null> {
  const businessId = await getOwnedBusinessId(ownerId);

  const conversation = await prisma.communicationConversation.findFirst({
    where: { id: ticketId, businessId },
    include: {
      customer: { select: { name: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 50 },
    },
  });

  if (!conversation) return null;

  const inboundMessages = conversation.messages.filter((m) => m.messageType === "INBOUND");
  const allText = inboundMessages.map((m) => m.body).join(" ");
  const intents = allText.trim() ? await detectIntentsFromText(ownerId, allText) : ["general"];
  const lastInbound = inboundMessages[inboundMessages.length - 1];

  const summaryParts = [
    `${inboundMessages.length} customer message(s)`,
    intents.length > 0 ? `Topics: ${intents.join(", ")}` : null,
    conversation.status !== "CLOSED" ? `Status: ${conversation.status}` : "Resolved",
  ].filter(Boolean);

  return {
    ticketId: conversation.id,
    subject: conversation.subject,
    customerName: conversation.customer?.name ?? null,
    messageCount: conversation.messages.length,
    summary: summaryParts.join(" · "),
    lastMessagePreview: lastInbound?.body.slice(0, 200) ?? "No messages",
    intents,
  };
}

export async function analyzeOpenConversations(ownerId: string): Promise<ConversationSummary[]> {
  const businessId = await getOwnedBusinessId(ownerId);

  const conversations = await prisma.communicationConversation.findMany({
    where: { businessId, status: { not: "CLOSED" } },
    select: { id: true },
    orderBy: { lastMessageAt: "desc" },
    take: 10,
  });

  const summaries: ConversationSummary[] = [];
  for (const conversation of conversations) {
    const summary = await summarizeConversation(ownerId, conversation.id);
    if (summary) summaries.push(summary);
  }

  return summaries;
}

export async function generateConversationInsights(ownerId: string): Promise<number> {
  return runOwnerDomainInsightTask(ownerId, {
    module: "support",
    task: "conversation-insights",
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

export async function getConversationMessages(ownerId: string, ticketId: string) {
  const businessId = await getOwnedBusinessId(ownerId);

  return prisma.communicationMessage.findMany({
    where: { conversationId: ticketId, businessId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      messageType: true,
      senderType: true,
      body: true,
      createdAt: true,
      isInternal: true,
    },
  });
}
