import type {
  AiConversation,
  AiConversationInput,
  AiMessage,
  AiSendMessageInput,
} from "@/modules/ai/types/conversation";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Manages AI conversation threads and message history (mock, in-memory). */
export class AIConversationManager {
  private readonly conversations = new Map<string, AiConversation>();

  create(input: AiConversationInput): AiConversation {
    const now = new Date().toISOString();
    const conversation: AiConversation = {
      id: createId("conv"),
      title: input.title ?? `Conversation with ${input.agentSlug}`,
      agentSlug: input.agentSlug,
      userId: input.userId,
      workspaceId: input.workspaceId ?? null,
      businessId: input.businessId ?? null,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  get(conversationId: string): AiConversation | undefined {
    return this.conversations.get(conversationId);
  }

  getOrThrow(conversationId: string): AiConversation {
    const conversation = this.get(conversationId);

    if (!conversation) {
      throw new Error(`Conversation "${conversationId}" not found.`);
    }

    return conversation;
  }

  list(userId?: string): AiConversation[] {
    const all = Array.from(this.conversations.values());

    if (!userId) {
      return all.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    }

    return all
      .filter((conversation) => conversation.userId === userId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  addMessage(input: AiSendMessageInput): AiMessage {
    const conversation = this.getOrThrow(input.conversationId);
    const message: AiMessage = {
      id: createId("msg"),
      role: input.role ?? "user",
      content: input.content,
      agentSlug: conversation.agentSlug,
      createdAt: new Date().toISOString(),
    };

    conversation.messages.push(message);
    conversation.updatedAt = message.createdAt;
    this.conversations.set(conversation.id, conversation);

    return message;
  }

  addAssistantMessage(conversationId: string, content: string): AiMessage {
    return this.addMessage({ conversationId, content, role: "assistant" });
  }

  getMessages(conversationId: string): AiMessage[] {
    return this.getOrThrow(conversationId).messages;
  }

  delete(conversationId: string): boolean {
    return this.conversations.delete(conversationId);
  }
}

export const aiConversationManager = new AIConversationManager();
