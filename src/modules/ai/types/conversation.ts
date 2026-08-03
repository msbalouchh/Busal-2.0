export type AiMessageRole = "system" | "user" | "assistant" | "tool";

export interface AiMessage {
  id: string;
  role: AiMessageRole;
  content: string;
  agentSlug?: string;
  toolCallId?: string;
  createdAt: string;
}

export interface AiConversation {
  id: string;
  title: string;
  agentSlug: string;
  userId: string;
  workspaceId: string | null;
  businessId: string | null;
  messages: AiMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AiConversationInput {
  agentSlug: string;
  userId: string;
  workspaceId?: string | null;
  businessId?: string | null;
  title?: string;
}

export interface AiSendMessageInput {
  conversationId: string;
  content: string;
  role?: Extract<AiMessageRole, "user" | "assistant">;
}
