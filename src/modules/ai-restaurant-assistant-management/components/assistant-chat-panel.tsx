"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendAssistantMessageAction } from "@/modules/ai-restaurant-assistant-management/actions/ai-restaurant-assistant-actions";
import { AssistantNav } from "@/modules/ai-restaurant-assistant-management/components/assistant-nav";
import { ConversationSidebar } from "@/modules/ai-restaurant-assistant-management/components/conversation-sidebar";
import { InsightCardsGrid } from "@/modules/ai-restaurant-assistant-management/components/insight-cards";
import { SUGGESTED_PROMPTS } from "@/modules/ai-restaurant-assistant-management/constants/routes";
import { AiMarkdownMessage } from "@/modules/ai-platform/components/ai-markdown-message";
import type { AiRestaurantAssistantContext } from "@/modules/ai-restaurant-assistant-management/lib/get-ai-restaurant-assistant-context";
import type {
  ConversationListResult,
  MessageRecord,
} from "@/modules/ai-restaurant-assistant-management/types/ai-restaurant-assistant-types";

interface AssistantChatPanelProps {
  context: AiRestaurantAssistantContext;
  conversations: ConversationListResult;
  initialMessages?: MessageRecord[];
  activeConversationId?: string | null;
}

export function AssistantChatPanel({
  context,
  conversations,
  initialMessages = [],
  activeConversationId,
}: AssistantChatPanelProps) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [insightCards, setInsightCards] = useState<
    NonNullable<Awaited<ReturnType<typeof sendAssistantMessageAction>>["insightCards"]>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [conversationId, setConversationId] = useState<string | null>(activeConversationId ?? null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
    setConversationId(activeConversationId ?? null);
  }, [initialMessages, activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  const submitMessage = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || isPending || !context.permissionsFlags.canChat) return;

    setError(null);
    const optimisticUser: MessageRecord = {
      id: `temp-user-${Date.now()}`,
      conversationId: conversationId ?? "pending",
      role: "USER",
      content: trimmed,
      metadata: {},
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimisticUser]);
    setInput("");

    startTransition(async () => {
      try {
        const response = await sendAssistantMessageAction({
          conversationId,
          message: trimmed,
          branchId: context.selectedBranchId,
        });

        setConversationId(response.conversationId);
        setInsightCards(response.insightCards ?? []);
        setMessages((current) => [
          ...current.filter((entry) => entry.id !== optimisticUser.id),
          optimisticUser,
          response.message,
        ]);

        if (!activeConversationId) {
          router.replace(
            `/app/restaurant/assistant/chat?conversationId=${response.conversationId}`,
          );
        } else {
          router.refresh();
        }
      } catch (submitError) {
        setMessages((current) => current.filter((entry) => entry.id !== optimisticUser.id));
        setError(submitError instanceof Error ? submitError.message : "Assistant request failed");
      }
    });
  };

  return (
    <div className="space-y-6">
      <AssistantNav />

      <div className="grid min-h-[70vh] gap-4 lg:grid-cols-[280px_1fr]">
        <ConversationSidebar
          conversations={conversations.items}
          activeConversationId={conversationId}
          canChat={context.permissionsFlags.canChat}
        />

        <section className="bg-card flex flex-col rounded-xl border">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Ask about sales, reservations, inventory, customers, kitchen, or staff
                  performance. Answers are composed from your live restaurant data.
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <Button
                      key={prompt}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => submitMessage(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-3xl rounded-lg px-4 py-3 text-sm ${
                    message.role === "USER"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted"
                  }`}
                >
                  {message.role === "ASSISTANT" ? (
                    <AiMarkdownMessage content={message.content} />
                  ) : (
                    message.content
                  )}
                </div>
              ))
            )}
            {isPending ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Composing answer from restaurant data...
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          {insightCards.length > 0 ? (
            <div className="border-t p-4">
              <InsightCardsGrid insights={insightCards} title="Related insights" />
            </div>
          ) : null}

          <div className="space-y-2 border-t p-4">
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                submitMessage(input);
              }}
            >
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask the restaurant assistant..."
                disabled={isPending || !context.permissionsFlags.canChat}
              />
              <Button type="submit" disabled={isPending || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
