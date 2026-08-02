import "server-only";

import { prisma } from "@/lib/prisma";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { createSupportInsight } from "@/services/ai-support-response-recommendation.service";

export interface ConversationSummary {
  ticketId: string;
  subject: string | null;
  customerName: string | null;
  messageCount: number;
  summary: string;
  lastMessagePreview: string;
  intents: string[];
}

const INTENT_KEYWORDS: Record<string, string[]> = {
  order: ["order", "delivery", "refund", "cancel"],
  billing: ["payment", "charge", "invoice", "bill"],
  account: ["account", "login", "password", "profile"],
  complaint: ["complaint", "unhappy", "disappointed", "terrible", "awful"],
  inquiry: ["question", "how", "what", "when", "where"],
  loyalty: ["points", "reward", "loyalty", "discount"],
};

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export function detectIntentsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const intents: string[] = [];

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      intents.push(intent);
    }
  }

  return intents.length > 0 ? intents : ["general"];
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
  const intents = detectIntentsFromText(allText);
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
  const businessId = await getOwnedBusinessId(ownerId);
  const summaries = await analyzeOpenConversations(ownerId);
  let created = 0;

  for (const summary of summaries.slice(0, 5)) {
    await createSupportInsight(businessId, {
      ticketId: summary.ticketId,
      title: `Conversation summary: ${summary.subject ?? "Support request"}`,
      description: summary.summary,
      priority: summary.intents.includes("complaint") ? "HIGH" : "MEDIUM",
      recommendation: `Latest: "${summary.lastMessagePreview.slice(0, 100)}..."`,
      metadata: { intents: summary.intents },
    });
    created += 1;
  }

  return created;
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
