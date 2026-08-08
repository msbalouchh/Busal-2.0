import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { aiPromptManager } from "@/modules/ai-engine/managers/prompt-manager";

export interface ConversationRecord {
  id: string;
  businessId: string;
  title: string;
  messages: Array<{ id: string; role: string; content: string; createdAt: string }>;
}

/** Prisma-backed conversation history manager. */
export class AiConversationManager {
  async getOrCreate(input: {
    businessId: string;
    conversationId?: string;
    staffId?: string | null;
    title?: string;
  }): Promise<ConversationRecord> {
    if (input.conversationId) {
      const existing = await prisma.aIConversation.findFirst({
        where: { id: input.conversationId, businessId: input.businessId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });

      if (existing) {
        return this.mapConversation(existing);
      }
    }

    const created = await prisma.aIConversation.create({
      data: {
        businessId: input.businessId,
        staffId: input.staffId ?? null,
        title: input.title ?? "Busal AI Conversation",
      },
      include: { messages: true },
    });

    return this.mapConversation(created);
  }

  async appendMessage(conversationId: string, role: "USER" | "ASSISTANT" | "SYSTEM", content: string): Promise<void> {
    await prisma.aIMessage.create({
      data: {
        conversationId,
        role,
        content,
        metadata: {} as Prisma.InputJsonValue,
      },
    });

    await prisma.aIConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  }

  async getMessagesForPrompt(conversationId: string): Promise<Array<{ role: "user" | "assistant" | "system"; content: string }>> {
    const messages = await prisma.aIMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    const mapped = messages.map((message) => ({
      role: message.role.toLowerCase() as "user" | "assistant" | "system",
      content: message.content,
    }));

    return aiPromptManager.compressHistory(mapped, 20) as Array<{
      role: "user" | "assistant" | "system";
      content: string;
    }>;
  }

  private mapConversation(record: {
    id: string;
    businessId: string;
    title: string;
    messages: Array<{ id: string; role: string; content: string; createdAt: Date }>;
  }): ConversationRecord {
    return {
      id: record.id,
      businessId: record.businessId,
      title: record.title,
      messages: record.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      })),
    };
  }
}

export const aiConversationManager = new AiConversationManager();
