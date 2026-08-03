"use client";

import { useAi } from "@/modules/ai/hooks/use-ai";
import { aiConversationManager } from "@/modules/ai/services/conversation-manager";

export function useAiConversation(conversationId?: string | null) {
  const { activeConversationId, setActiveConversation, context } = useAi();
  const resolvedId = conversationId ?? activeConversationId;

  const conversation = resolvedId ? aiConversationManager.get(resolvedId) : undefined;
  const conversations = aiConversationManager.list(context.userId);

  return {
    conversation,
    conversations,
    activeConversationId: resolvedId,
    setActiveConversation,
  };
}
